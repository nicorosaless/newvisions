# Voice Pool (LRU) - Especificación

Última actualización: 14-09-2025

## 1. Objetivo
Optimizar el uso de los (máx) N slots de voces clonadas que permite ElevenLabs (tier actual: 10) evitando:
- Crear una voz desde cero en cada `/perform` (latencia + costo)
- Mantener voces duplicadas para la misma muestra
- Fugas de voces (huérfanas) al exceder la capacidad

## 2. Modelo Conceptual
Cada usuario tiene exactamente **un** `voice_clone_id` persistente propio (creado UNA sola vez tras subir/validar su muestra). El pool actúa como una **ventana LRU** de capacidad fija sobre esos `voice_clone_id` activos.

Si el `voice_clone_id` de un usuario sale de la ventana (evictado), no se destruye la voz en provider aún (opcional futuro), simplemente deja de estar “caliente” en el pool. Al volver a usar `/perform`, se re-inserta en la cabeza (MRU) expulsando al LRU si es necesario.

## 3. Terminología
- `voice_clone_id`: ID de la voz clonada persistente en ElevenLabs asociada a un usuario (1:1).
- Pool: Lista ordenada (MRU → LRU) de hasta `capacity` IDs.
- MRU (Most Recently Used): Primer elemento (head).
- LRU (Least Recently Used): Último elemento (tail) candidato a expulsión.

## 4. Momento de Creación del `voice_clone_id`
1. Usuario sube su muestra válida (30–60s, formato aceptado) via `POST /users/{id}/voice`.
2. Sistema transcodifica / normaliza (futuro) y crea UNA sola vez la voz en ElevenLabs → obtiene `voice_clone_id`.
3. Se guarda en documento de usuario: `users.voice_clone_id`.
4. (Opcional) Se inserta inmediatamente en pool (modo eager) o se difiere hasta el primer `/perform` (modo lazy). Actual: **lazy**.

## 5. Flujo en `/perform`
```
Input: user_id
Step 1: cargar usuario (debe tener voice_clone_id != None para ruta clon)
Step 2: lookup en colección pool por voice_clone_id
  - Si existe => marcar como MRU (touch) y sintetizar usando ese ID
  - Si NO existe =>
       a) iniciar transacción lógica (o secuencia atomic-ish)
       b) contar elementos del pool
       c) si count >= capacity => identificar LRU (tail) y expulsar
       d) insertar nuevo doc para voice_clone_id del usuario como MRU
       e) sintetizar
Step 3: actualizar métricas (reuse o insert + optional eviction)
Step 4: responder con audio + metadata { voiceSource: pooled_voice_id }
```

## 6. Estructura de Colección `voice_pool`
```json
{
  "_id": ObjectId,
  "voice_id": "elevenlabs_voice_id",          // igual a user.voice_clone_id
  "user_id": "ref users._id",                 // redundante para búsquedas inversas
  "created_at": ISODate,                       // momento de primera inserción en pool
  "last_used_at": ISODate,                     // actualización en cada perform
  "reuse_count": 0,                            // incrementa en cada uso (touch)
  "evicted_at": null,                          // timestamp cuando fue removida (histórico opcional)
  "active": true                                // flag lógico (soft delete opcional)
}
```
Notas:
- No se guarda sample_hash aquí porque el clon es 1:1 por usuario (hash puede vivir en doc usuario si se requiere)
- `active` + `evicted_at` permiten auditoría si se desea mantener histórico (fase futura)

## 7. Operaciones Básicas
### 7.1 `acquire_voice(user)`
Responsabilidad: asegurar que el `voice_clone_id` del usuario quede en MRU y retornar su `voice_id`.

Pseudocódigo:
```python
def acquire_voice(db, user):
    vid = user.voice_clone_id
    if not vid:
        return None  # forza fallback a sample / tts

    doc = db.voice_pool.find_one({"voice_id": vid})
    now = utcnow()

    if doc:
        db.voice_pool.update_one(
            {"_id": doc["_id"]},
            {"$set": {"last_used_at": now}, "$inc": {"reuse_count": 1}}
        )
        return vid, "reuse"

    # no está en pool => insertar como MRU expulsando LRU si capacity alcanzada
    count = db.voice_pool.count_documents({})
    if count >= CAPACITY:
        lru = db.voice_pool.find().sort("last_used_at", 1).limit(1)[0]
        # opcional: eliminar remoto provider (futuro)
        db.voice_pool.delete_one({"_id": lru["_id"]})
        evicted = lru["voice_id"]
    else:
        evicted = None

    db.voice_pool.insert_one({
        "voice_id": vid,
        "user_id": user._id,
        "created_at": now,
        "last_used_at": now,
        "reuse_count": 0,
    })
    return vid, ("insert_evicted" if evicted else "insert"), evicted
```

### 7.2 Touch (ya cubierto)
Actualizar `last_used_at` + `reuse_count`.

### 7.3 Evicción Manual
Admin puede forzar limpieza:
```
POST /admin/voice-pool/evict { voice_id }
```
- Elimina entrada del pool (opcional borrar provider voz si política lo exige).

## 8. Estrategia de Orden (MRU / LRU)
Se deriva de `last_used_at`. No se mantiene array explícito.
- Para obtener LRU: sort asc por `last_used_at`.
- Para panel de estado: top N por `reuse_count` o `last_used_at` desc.

## 9. Políticas de Evicción Futuras
- `lru` (actual)
- `ttl`: eliminar voces con `last_used_at` < now - TTL
- `hybrid`: score = w1*recency + w2*frecuencia

## 10. Métricas
- `voice_pool_reuse_total` (+1 caso reuse)
- `voice_pool_insert_total` (+1 caso insert/insert_evicted)
- `voice_pool_evictions_total` (+1 cuando se elimina LRU)
- `voice_pool_current_size`
- `voice_pool_reuse_ratio = reuse_total / (reuse_total + insert_total)`

## 11. Logs Estructurados
Ejemplo evento reuse:
```json
{
  "event": "voice_pool_acquire",
  "mode": "reuse",
  "voice_id": "...",
  "user_id": "...",
  "latency_ms": 12
}
```
Evento insert con evicción:
```json
{
  "event": "voice_pool_acquire",
  "mode": "insert_evicted",
  "evicted_voice_id": "...",
  "new_voice_id": "...",
  "user_id": "...",
  "latency_ms": 34
}
```

## 12. Casos de Error
| Caso | Comportamiento | Acción |
|------|----------------|--------|
| user sin `voice_clone_id` | No pool | fallback a sample/tts |
| fallo DB al contar | Reintento simple | log error + fallback tts |
| fallo inserción | fallback tts | registrar métrica error |
| voz expulsada pero borrado provider falla (futuro) | retry diferido | marcar alerta |

## 13. Reconciliación Provider (Futuro)
Job periódico:
1. Listar voces en ElevenLabs.
2. Construir set local `voice_pool.voice_id` + `users.voice_clone_id`.
3. Borrar en provider las voces que no estén en ningún set anterior y excedan retención.

## 14. Seguridad
- Requiere usuario autenticado (JWT) antes de permitir `/perform`.
- Evitar enumeración de `voice_id` (no exponer IDs de otros usuarios).
- Endpoints admin protegidos por rol/claim.

## 15. Roadmap Incremental
| Fase | Entrega | Descripción |
|------|---------|-------------|
| 1 | LRU básico | Inserción / reuse / evict local |
| 2 | Métricas + logs | Exposición Prometheus / structured logs |
| 3 | Normalización audio | Hash estable + calidad |
| 4 | Reconciliación provider | Limpieza huérfanas |
| 5 | Políticas avanzadas | TTL / híbrido / pre-warm |

## 16. Diferencias con Diseño Anterior
- Ya NO se crean clones efímeros por perform; cada usuario mantiene uno persistente.
- El pool no crea múltiples voces para el mismo usuario ni para la misma muestra.
- Evicción no destruye obligatoriamente el recurso remoto (se puede parametrizar).

## 17. Diagrama ASCII Simplificado
```
+-----------+        acquire        +------------------+
|  /perform | --------------------> | VoicePoolManager |
+-----------+                       +------------------+
       |                                   | (find voice_id)
       |                                   v
       |                            [en pool?]
       |                                 /   \
       |                               sí     no
       |                               |       |
       |                         touch +reuse  {count>=cap?}
       |                                         /    \
       |                                       sí      no
       |                                       |        |
       |                                   evict LRU  insert
       |                                          \     |
       |                                           +----+
       |                                                |
       v                                                v
  synthesize_with_user_voice  <-------------------  voice_id listo
```

## 18. Puntos Abiertos
- ¿Eliminar sample crudo como fallback? (Experiencia inconsistente)
- ¿Límite de creación: 1 clon por día para impedir thrash? (pendiente)
- ¿Persistir histórico de evicciones para análisis? (opcional)

## 19. Checklist Implementación
- [ ] Endpoint creación de clon (si no existe) tras upload
- [ ] Persistir `voice_clone_id` en doc usuario
- [ ] Implementar `acquire_voice` LRU como arriba
- [ ] Reemplazar lógica actual que crea nueva voz cuando falta pool (adaptar a persistente por usuario)
- [ ] Métricas recolección
- [ ] Tests: reuse, insert, insert con evict

---

Fin de especificación.

## 20. Herramientas Operativas Implementadas (Scripts)

Para soportar monitoreo de capacidad de voces y mantenimiento manual del pool / provider se añadieron los siguientes scripts en `backend/scripts/`:

### 20.1 `detect_elevenlabs_capacity.py` (modo simplificado)
- Ahora siempre imprime únicamente un JSON con:
  - `cloned_voice_names`: lista de nombres de voces clonadas detectadas vía `GET /v1/voices`.
  - `over_10_excess_count`: cuántas exceden el umbral (cap actual esperado = 10).
  - `total_cloned`: total de voces clonadas.
- Uso:
```
python detect_elevenlabs_capacity.py
```
- Objetivo: verificar rápidamente si se alcanzó o sobrepasó el límite del plan (heurística) sin ruido adicional.

### 20.2 `delete_voice.py`
Script de administración para eliminar voces clonadas directamente en el provider (NO sólo del pool). Debe usarse con precaución porque la eliminación es irreversible en ElevenLabs.

Funciones clave:
- `--list`: lista voces clonadas + exceso sobre 10.
- `--id VOICE_ID`: elimina voz por ID.
- `--name "Nombre"`: elimina por nombre (match exacto o heurístico si exacto no existe y hay una única coincidencia de substring).
- `--delete-last`: elimina la última voz clonada según el orden devuelto por la API (sirve como atajo para liberar un slot rápidamente).
- `--force`: omite confirmación interactiva.

Ejemplos:
```
python backend/scripts/delete_voice.py --list
python backend/scripts/delete_voice.py --id <VOICE_ID> --force
python backend/scripts/delete_voice.py --name "usuario_demo" --force
python backend/scripts/delete_voice.py --delete-last --force
```

Campos de salida típicos:
```json
{
  "deleted": true,
  "voice_id": "...",
  "name": "...",
  "provider_response": {"status": "ok"}
}
```

### 20.3 Relación con el Pool LRU
Actualmente estos scripts actúan a nivel provider, no manipulan directamente la colección `voice_pool` (que es lógica local). Si se elimina una voz clonada en ElevenLabs y existía aún una entrada en `voice_pool`, el próximo `acquire_voice` fallará la síntesis con ese `voice_id` y deberá:
1. Detectar error provider (404 / recurso no encontrado).
2. Remover entrada obsoleta del pool.
3. (Opcional) Forzar recreación de clon si la política de negocio lo permite.

### 20.4 Consideraciones de Seguridad y Uso Operativo
- Ejecutar siempre primero `--list` antes de borrar.
- Evitar scripts de borrado dentro de pipelines automáticos salvo que exista estrategia de recreación automática.
- Registrar (en futuro) auditoría de borrados para correlacionar con métricas de uso.

### 20.5 Próximos Pasos Sugeridos
- Endpoint admin `GET /admin/voice-clones` exponiendo mismo JSON de `detect_elevenlabs_capacity.py`.
- Endpoint admin `DELETE /admin/voice-clones/{voice_id}` que reutilice lógica del script (con role check).
- Tarea de reconciliación que marque entradas del pool cuyo `voice_id` ya no existe en provider.
- Métrica `voice_pool_orphan_entries` (cuenta de entradas cuyo provider voice falta).

---
