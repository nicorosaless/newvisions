# Voice Clone Flow (Perform + Capacity)

Última actualización: 16-09-2025

## Objetivo
Garantizar que cuando el usuario pulsa "Perform" en el home:
- Su cuenta/voz exista en ElevenLabs con un nombre igual al `voice_clone_id`.
- El `voice_clone_id` se genere una sola vez al pulsar "Generate Voice Clone".
- Si la capacidad de voces del provider (ElevenLabs) está llena, expulsar a alguien (evict) para liberar un slot y poder crear/usar la voz del usuario sin errores.

## Nomenclatura clave
- `voice_clone_id`: Identificador estable 1:1 por usuario. Se crea exactamente UNA vez cuando el usuario pulsa "Generate Voice Clone" tras subir su muestra válida (30–60s). Este valor debe ser usado como:
  - `name` de la voz en ElevenLabs (además del `voice_id` interno del provider).
  - Clave de referencia en la app para síntesis posterior.
- `voice_pool` (local LRU): Colección Mongo que mantiene las voces activas en una ventana de capacidad fija (cap del plan). Sirve como mecanismo de selección/evicción de MRU/LRU.

## Momentos del flujo

### 1) Generate Voice Clone (única vez por usuario)
1. Validar que el usuario subió una muestra válida (30–60s, MP3 preferente).
2. Construir `voice_clone_id` estable si no existe. Convención propuesta: `user_<prefix>` o `u_<ObjectId[:8]>`.
3. Antes de crear en ElevenLabs:
   - Chequear capacidad provider. Si se alcanzó el máximo de voces permitidas por el plan, seleccionar una entrada para evict.
   - Política de evicción: LRU basada en `voice_pool.last_used_at`.
   - Ejecutar evicción provider-side: borrar voz en ElevenLabs correspondiente al LRU seleccionado y eliminar su entrada en `voice_pool`.
4. Crear la nueva voz en ElevenLabs usando `name = voice_clone_id` y la muestra del usuario.
5. Persistir `users.voice_clone_id = voice_clone_id` y `users.voice_clone_provider = "elevenlabs"`.
6. Insertar como MRU en `voice_pool`.

Resultado: el usuario queda listo para sintetizar con su `voice_clone_id` y la voz existe en ElevenLabs con ese mismo nombre.

### 2) Perform (uso normal)
1. Recuperar `users.voice_clone_id`.
2. Asegurar presencia en `voice_pool`:
   - Si ya está en pool: touch (MRU) y continuar.
   - Si no está y pool lleno: evict LRU (sólo entrada local) y reinsertar como MRU.
   - Nota: En Perform no se crean voces nuevas; sólo se usa la existente. La creación sucede en el paso 1.
3. Llamar TTS de ElevenLabs con `model_id` configurado y `voice_id` del usuario.
4. Registrar métricas y consumo de caracteres.

## API/Servicios involucrados
- `POST /users/{id}/voice` (upload): Almacena la muestra binaria validada.
- `POST /users/{id}/voice/clone` (Generate Voice Clone):
  - Crea `voice_clone_id` si no existe.
  - Gestiona capacidad (evicción provider si es necesario).
  - Crea voz en ElevenLabs con `name = voice_clone_id`.
  - Persiste en `users` y actualiza `voice_pool` como MRU.
- `POST /perform`: Usa el `voice_clone_id` ya existente. No crea nuevas voces en provider.

## Especificación de Evicción de Capacidad (provider)
- Fuente de verdad para uso reciente: colección `voice_pool`.
- Algoritmo:
  - Si `total_voices_provider >= CAPACIDAD` ⇒ obtener LRU desde `voice_pool`.
  - Borrar en provider la voz LRU: `DELETE /v1/voices/{voice_id}`.
  - Borrar entrada `voice_pool` correspondiente.
  - Reintentar creación de la nueva voz del usuario.
- Consideraciones:
  - Evitar borrar la propia voz del usuario si aparece como LRU (no debería ocurrir si aún no existe).
  - Manejar errores del provider con reintentos limitados y logs estructurados.

## Contratos y convenciones
- `voice_clone_id` como `name` en ElevenLabs:
  - Al crear voz: `data = { name: voice_clone_id, description: "user persistent voice" }`.
  - Al listar o administrar: buscar por `name == voice_clone_id` para auditabilidad.
- Idempotencia de creación:
  - Si `users.voice_clone_id` ya existe, no crear otra voz. Validar que existe en provider y, si no, recrearla con el mismo `name`.

## Pseudocódigo clave

Creación con capacidad segura:
```python
CAPACITY = settings.elevenlabs_pool_capacity

def ensure_capacity_and_create_voice(user_id, sample_bytes, db):
    vid = get_user_voice_id(user_id)  # users.voice_clone_id
    if vid:
        return vid  # ya existe

    # 1) generar id estable
    vid = f"u_{user_id[:8]}"

    # 2) comprobar capacidad provider
    total = provider_count_voices()
    if total >= CAPACITY:
        lru = db["voice_pool"].find_one(sort=[("last_used_at", 1)])
        if not lru:
            raise RuntimeError("capacity_full_no_lru")
        provider_delete_voice(lru["voice_id"])  # DELETE provider
        db["voice_pool"].delete_one({"_id": lru["_id"]})

    # 3) crear voz en provider con name = vid
    new_voice_id = provider_create_voice(name=vid, sample=sample_bytes)

    # 4) persistir en users y pool
    set_user_voice_clone_id(user_id, new_voice_id, name=vid)
    insert_pool_mru(db, voice_id=new_voice_id, user_id=user_id)
    return new_voice_id
```

Perform:
```python
def perform(user_id, text, db):
    vid = get_user_voice_id(user_id)
    if not vid:
        return error("VOICE_CLONE_REQUIRED")

    ensure_pool_mru(db, vid, user_id)  # touch/insert LRU
    audio = elevenlabs_tts(voice_id=vid, text=text)
    return audio
```

## Métricas y logs
- `provider_capacity_evictions_total`: evicciones ejecutadas en provider.
- `voice_pool_evictions_total`: evicciones locales.
- `voice_clone_create_total`: voces creadas en provider.
- `voice_clone_create_errors_total`: errores en creación.
- Logs estructurados por cada etapa con `event` y `stage` (create/check/evict/tts).

## Riesgos y mitigaciones
- Borrado de una voz aún activa: usar LRU real de `voice_pool` reduce la probabilidad; considerar TTL/score híbrido si fuese necesario.
- Límite de rate del provider: añadir backoff exponencial y retries acotados.
- Inconsistencia local/provider: agregar job de reconciliación futuro.

## Próximos pasos
- Añadir endpoint `POST /users/{id}/voice/clone` si no existe.
- Implementar función `ensure_capacity_and_create_voice` en `voice_clone_service.py`.
- Añadir tests: creación con pool lleno, evicción provider, perform sin creación.
