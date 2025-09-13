# Roadmap Backend (Servicios y Pipeline Interno)

Última actualización: 13-09-2025 (Alineación diseño pool vs implementación actual)

## 1. Estado Actual
- ✅ Registro (`/auth/register`) y Login (`/auth/login`) (sin JWT todavía)
- ✅ Generación de pensamiento (`/generate-thought`) y audio (`/generate-audio`)
- ✅ Scripts de mantenimiento DB y generación de activation codes
- ✅ Estructura modular base (`backend_structure.md`)
- ✅ Persistencia y normalización de `settings` (`GET/PUT /users/{id}/settings`)
- ✅ Endpoint `/perform` con cadena de selección: provider voice_clone_id → pooled_voice_id (hash de sample) → sample crudo → TTS genérico
- ✅ Eliminado placeholder estático y clon efímero por request
- ⚠️ Implementación pool actual basada en `sample_hash` compartido, NO en un `voice_clone_id` persistente 1:1 por usuario como define `docs/pool.md`
- ⚠️ No existe aún creación única de `voice_clone_id` en upload; se crean voces solo cuando se fuerza creación dentro de perform (lazy + por hash)
- ⚠️ No hay JWT ni contexto autenticado
- ✅ Límite provisional `charCount` = 4000 (enforced) (sin test dedicado)
- ⚠️ Métricas/structured logging mínimos (solo prints)
- ⚠️ Sin tests específicos de pool (reuse / evict)

## 1.1 Problema Actual (Resumen Crítico)
La implementación difiere del diseño objetivo (pool por `voice_clone_id` persistente por usuario). Actualmente:
1. El pool indexa por `sample_hash` y almacena `voice_id` reutilizable multi-usuario si la muestra coincide, mientras que el diseño objetivo exige un `voice_clone_id` único y estable por usuario (1:1).
2. `/perform` intenta primero `voice_clone_id` (campo user) pero no hay flujo que lo cree tras upload; la mayoría de usuarios tendrán `None` y caerán en lógica de pool por sample.
3. `create_persistent_voice_clone` se invoca desde perform cuando no hay audio clon reutilizable; esto crea voz y la registra en pool pero NO persiste `voice_clone_id` en el documento usuario.
4. No existe mecanismo de promoción: después de crear un clon persistente, el usuario debería tener su `voice_clone_id` para saltar directamente al paso provider en usos futuros.
5. Evicción LRU elimina el doc local sin borrar la voz remota ni actualizar a los usuarios afectados.
6. Fallback a sample crudo sigue presente; produce audio que no refleja el texto generado.
7. No hay normalización previa → variaciones menores generan hashes distintos y crean clones redundantes.

**Técnico / Arquitectura**
- Pool actual: hash-based multi-usuario; diseño objetivo: per-user voice id estable + pool solo gestiona “calentamiento” (prioridad) no identidad.
- Sin normalización previa del audio (hash inestable ante micro cambios).
- Creación lazily en perform, no en upload (sube latencia primer uso).
- Falta persistencia automática de `voice_clone_id` en `users` tras crear la voz.
- No se marca en el pool la política de evicción para borrado remoto diferido.
- No hay métricas de reuse/evict/create.

**Calidad de Voz / Datos**
- Solo se usa una muestra (30–60s) sin validaciones de SNR, silencio o clipping → la calidad del clon puede ser inconsistente.
- No existe pipeline de normalización (loudness, trimming de silencios, formato uniforme antes de subir).
- No se conserva historial de calidad / puntajes; no se puede comparar mejoras futuras.

**Costos y Límites del Proveedor**
- Límite de 10 voices en ElevenLabs ahora gestionado mediante LRU (no creamos más de `capacity`).
- Evicción local elimina doc pero aún no borra recurso remoto (riesgo de fuga si llenamos el tier repetidamente) → pendiente reconciliación y delete provider.
- No se aplican rate limits internos → un usuario podría forzar rotaciones rápidas del pool.

**Fallback Chain**
- Objetivo: provider voice_clone_id → pooled (prioridad MRU) → TTS genérico.
- Actual: provider → pooled (hash sample) → sample crudo → TTS. (Necesario eliminar sample crudo o hacerlo opt-in debug)

**Experiencia de Usuario**
- `voiceSource` expone la ruta tomada pero el frontend no distingue aún para avisar “usando voz temporal” vs “reproduciendo muestra directa”.
- Si se devuelve sample crudo, el usuario escucha exactamente su grabación (no el contenido generado) — esto puede percibirse como error.

**Seguridad / Observabilidad**
- No hay JWT todavía → cualquier actor con user_id podría disparar clones (abuso de API key). 
- No hay structured logging JSON centralizado; debugging depende de prints.
- Sin métricas de errores / ratio de fallbacks.

**Testing**
- Sin pruebas automáticas del flujo efímero (creación, síntesis, borrado, fallbacks). Posibles regresiones silenciosas.

## 1.2 Causas Raíz Clave
1. Diseño enfocado en rapidez de integración (prioridad a “que funcione”) sin fase de endurecimiento.
2. Ausencia de capa de orquestación async (no Celery / RQ / background tasks). 
3. No se diseñó diferenciación clara entre “muestra de entrenamiento” y “voz clonada lista”.
4. Falta de límites de uso (rate limiting, quotas por minuto) antes de exponer el endpoint.

## 1.3 Impacto Potencial
| Riesgo | Impacto | Severidad |
|--------|---------|-----------|
| Latencia elevada | Mala UX / abandono | Alta |
| Creación fallida repetida | Costos y tiempo perdido | Media |
| Fallback a sample crudo | Contenido no coincide con texto | Alta |
| Fugas de clones | Agotar límite provider | Alta |
| Abuso (sin auth fuerte) | Costos inesperados | Alta |
| Sin métricas | Difícil optimización | Media |
| Falta de tests | Regressions silenciosas | Media |

## 1.4 Plan de Mitigación Inmediata (Revisado)
1. Crear flujo de clon estable en upload: si user no tiene `voice_clone_id`, crear voz → guardar en `users.voice_clone_id` (modo eager) y opcionalmente insertar en pool (MRU).
2. Refactor pool para usar únicamente `voice_id` (per-user) como key; remover `sample_hash` y `users[]` multi-binding.
3. Eliminar fallback a sample crudo (behind feature flag `ALLOW_SAMPLE_FALLBACK=false`).
4. Añadir normalización previa (loudness + trim silencio) antes de crear clon para consistencia y mejor calidad.
5. Persistir métricas: `pool_reuse_total`, `pool_insert_total`, `pool_evictions_total`, `pool_current_size`.
6. Guardar en doc de evicción (o log) la `evicted_voice_id` y programar borrado remoto async (job/cron).
7. Endpoint `GET /users/{id}/voice/meta` para exponer `state: none|provider|pooled`.
8. Tests: (a) upload→clon→perform reuse, (b) llenar pool y evict, (c) desactivar pool, (d) fallback TTS.
9. Añadir JWT + rate limiting antes de permitir creación de clon.
10. Instrumentar logs estructurados JSON (one-line) por acquire/evict/create.

## 1.5 Futuro Cercano (Opciones de Evolución)
- Persistencia controlada: permitir 1 voice oficial por usuario (re-entrenable) + efímero solo como backup.
- Batch multi-muestras: permitir que el usuario suba varias muestras y crear un modelo más robusto si provider lo soporta.
- Ajustes dinámicos: mapear `stability`, `similarity`, `style` desde settings, exponer slider en UI.
- Streaming parcial de audio mientras se genera (si API lo soporta) para reducir TTFP percibido.

## 2. Voice Pool Manager (Diseño Objetivo vs Actual)
Objetivo: Ventana LRU de priorización (no identidad) sobre `voice_clone_id` per-user ya existentes. La identidad de la voz vive en el documento de usuario; el pool solo conserva “calientes” hasta `capacity`.

### 2.1 Concepto
- Pool LRU en Mongo (`voice_pool`): cada doc representa un voice_id persistente + hash de la muestra base normalizada.
- Clave principal: `sample_hash = sha256(muestra_preprocesada)`.
- Reuso: si un usuario con la misma muestra (hash idéntico) solicita perform, se reusa ese voice_id.
- Evicción: cuando `count >= capacity`, se elimina el LRU (menor `last_used_at`).
- TTL inactividad: voces no usadas en X minutos se purgan (limpieza periódica / on-demand).

### 2.2 Flujo /perform (diseño objetivo revisado)
1. user.voice_clone_id existe? -> direct synth
2. Pool.touch(voice_id) (actualiza last_used_at) si voice_id presente
3. Si voice_id no está en pool:
   - Si pool lleno -> evict LRU (log + programar delete remoto)
   - Insert voice_id como MRU
4. Synth con voice_id
5. Si user no tiene voice_clone_id pero tiene sample y feature create-on-perform habilitada -> crear clon estable (una vez), asignar a user, reintentar pasos 2-4
6. Si no hay sample/clon -> fallback TTS

### 2.3 Beneficios Esperados
- Disminución de clonaciones repetidas (costos + latencia).
- Latencia media menor tras primer uso (cache caliente).
- Control explícito de slots (nunca > capacity).
- Métrica de reuse ratio para tuning.

### 2.4 Riesgos / Mitigaciones
- Riesgo inconsistencia hash (cambios minúsculos) → aplicar pipeline de normalización (pendiente).
- Eliminación remota fallida al expulsar LRU → job de reconciliación (listar voices y suprimir huérfanas).
- Colisiones hash improbables pero posibles → almacenar bytes_len + quizás un digest secundario (xxhash) opcional.

### 2.5 Variables de Configuración
- `ELEVEN_LABS_POOL_ENABLED` (bool, por defecto true)
- `ELEVEN_LABS_POOL_CAPACITY` (int, default 10 según tier actual)
- `ELEVEN_LABS_POOL_TTL_MINUTES` (int, default 30)
- `ELEVEN_LABS_POOL_EVICTION_STRATEGY` (string: lru|ttl) – inicialmente lru

### 2.6 Tareas (Backlog Actualizado)
- [ ] Mover creación clon a upload voz (eager) y persistir `voice_clone_id`
- [ ] Migrar pool: clave `voice_id`, eliminar `sample_hash` y lista `users`
- [ ] Script migración: limpiar colección `voice_pool` antigua
- [ ] Remove fallback sample crudo (flag deprecado)
- [ ] Normalización audio (pipeline previo + hash post-normalización para idempotencia)
- [ ] Métricas pool + endpoints observabilidad (`/admin/voice-pool/status`)
- [ ] Eviction remoto diferido (cola jobs) + reconciliación programada
- [ ] Tests end-to-end pool (reuse, evict, reinserción)
- [ ] Endpoint `GET /users/{id}/voice/meta`
- [ ] JWT + rate limit creaciones
- [ ] Feature flag `POOL_ENABLED` runtime (cache / Redis)

### 2.7 Futuras Optimizaciones
- Estrategia híbrida LRU+LFU (score = recency * frecuencia).
- Pre-warm de voces de usuarios activos recientes.
- Clustering de muestras para compartir un mismo voice_id entre usuarios similares.


---

- ⚠️ Testing automático pendiente (unit / integration) especialmente para Perform y migración settings.

## 2. Objetivos de Corto Plazo (Backend / Frontend Inmediatos)
1. Crear flujo creación clon en upload + persistir `voice_clone_id`
2. Refactor pool a per-user voice_id LRU (sin sample_hash)
3. Remover fallback sample crudo en `/perform`
4. Añadir métricas pool y logging estructurado
5. JWT + dependencia usuario + rate limiting creación
6. Tests básicos límite char y pool (reuse/evict)
7. Endpoint `voice/meta` para estado voice

## 3. Backlog Secuenciado (Actualizado)
| 2 | Voice Pool (LRU) | Persistencia hasta capacity | Upload Voice |
| 2 | Perform (pool) | Texto + pooled voice reuse | Voice Pool |
| 1 | Afinar Prompt Builder | Ajustes tras validación manual | Perform v1 |
| 2 | JWT Auth | Tokens + dependencia usuario | Login |
| 2 | Ephemeral Clone Helper | `with_temp_voice_clone` abstracción | Upload Voice | ✅ |
| 2 | Perform (v2) | Texto + clon efímero + cleanup | Helper | ✅ |
| 3 | Métricas Iniciales | Contadores y latencias | Perform v1 |
| 3 | Rate Limits / Quotas | Ráfaga/minuto por IP/user | JWT |
| 3 | Tests Automatizados | Unit + integration básicos | Infra mínima |
| 4 | Settings Enriched | Ajustar voz dinámicamente | Settings base |
| 4 | Audio Streaming | (Opcional) streaming progresivo | Perform v2 |
| 5 | Cleanup Cron | Reset mensual + GC clones | Perform v2 |
| 5 | Observabilidad Ampliada | Dashboards / alertas | Métricas iniciales |

## 4. Cambios Necesarios en Backend
### 4.1 Autenticación (JWT)
- Crear `services/auth/jwt_handler.py`:
  - Funciones: `create_token(user_id)`, `verify_token(token)`.
  - Uso de `SECRET_KEY` en `.env`.
- Middleware / dependency: `get_current_user()`.
- Añadir cabecera `Authorization: Bearer <token>` en frontend.

### 4.2 Endpoints de Usuario
- `GET /user/me` → { user_id, username, email, charCount }.
- `GET /user/settings` y `PUT /user/settings`.
- `POST /user/voice` (multipart) → almacena binario (tamaño máx ~1-2MB) y valida formato.

### 4.3 Modelo de Settings (Validación)
- Pydantic `UserSettingsModel`:
  ```python
  class UserSettingsModel(BaseModel):
      language: Literal['english','spanish']
      voice_similarity: float = Field(ge=0, le=1)
      stability: float = Field(ge=0, le=1)
      add_background_sound: bool
      background_volume: float = Field(ge=0, le=1)
      sex: Literal['male','female']
      OS: Literal['android','ios']
  ```
- Guardar directamente en campo `settings` del documento usuario.

### 4.4 Pipeline Perform (v1 → v2)
- v1 (sin clon efímero): usar voice ID global si no hay `recordedVoice`.
**v2 (actual):**
1. Genera texto (Gemini / fallback).
2. Selección ruta de voz:
   - Persistente: si `voice_clone_id` ya existe → TTS directa provider.
   - Efímera: si solo hay `recordedVoiceBinary` → subir temporalmente → sintetizar → borrar.
   - Sample local: si no se pudo crear clon efímero pero existe muestra.
   - Placeholder estático.
   - Genérico TTS (ElevenLabs voz por defecto o silencio si no hay API key).
3. Devuelve `voiceSource` para debugging (`provider_voice_id | ephemeral_clone | user_sample | placeholder | tts`).
4. No mantiene `voice_id` efímero; cleanup inmediato.

### 4.5 charCount y Límites
- En `perform`: sumar `len(generated_text)`.
- Campo `charCount` reset mensualmente (cron futuro) o on-demand script.
- Bloqueo si supera 5000 (retornar 402 / 429).

### 4.6 Logging y Observabilidad
- Logger estructurado por petición (request_id).
- Métricas: `perform_latency_ms`, `clone_lifecycle_ms`, `elevenlabs_fail_ratio`.

## 5. Seguridad y Consistencia
- Sanitizar inputs (topic/value) longitud máxima (p.ej. 200 chars).
- Limitar tamaño de `recordedVoice` (config, p.ej. 3MB) y MIME types aceptados.
- Evitar exponer campos sensibles al frontend (password hash, recordedVoice binario).
- Reforzar índice únicos (`username`, `email`, `activation_codes.code`).

## 6. Riesgos y Mitigaciones
| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Límite de 10 clones ElevenLabs | Falla Perform | Clones efímeros + cleanup estricto |
| Fugas de voice_clone_id | Slots bloqueados | Cron de verificación + TTL | 
| Falta de JWT inicial | Uso no autenticado | Implementar ASAP (Fase 1) |
| Crecimiento charCount incontrolado | Costos / abuso | Límite + bloqueo |
| Archivos de audio grandes | Latencia / memoria | Validar tamaño y formato |

## 7. Métricas Iniciales Propuestas
- `perform_requests_total`
- `perform_success_total`
- `perform_fail_total`
- `clone_create_fail_total`
- `avg_perform_latency_ms`
- `avg_clone_lifecycle_ms`
- `chars_generated_total`

## 8. Checklist Resumido (Backend + Integraciones)
- [x] `/perform` básico con pool hash-based
- [x] Límite charCount (4000) enforcement
- [x] Upload voice endpoint (guarda sample MP3)
- [x] Eliminado placeholder estático
- [ ] Creación clon estable en upload
- [ ] Persistir `voice_clone_id` en user tras creación
- [ ] Refactor pool per-user voice_id
- [ ] Remover fallback sample crudo (flag)
- [ ] Métricas & logging estructurado pool
- [ ] JWT + dependencia usuario
- [ ] Rate limiting creación clon
- [ ] Tests pool (reuse/evict) + char limit + meta endpoint
- [ ] Endpoint `voice/meta`

## 9. Notas Futuras / Testing Pendiente
- Validar manualmente /perform con distintos `routine_type` (edge: desconocido → error esperado 400 si aplicamos validación futura).
- Añadir asserts sobre incremento charCount consistente.
- Confirmar fallback correcto cuando falta `cloningvoice.mp3`.
- Migrar conexiones Mongo a pool central (`database.py`).
- Evaluar streaming parcial de audio (chunked) si la latencia aumenta.
- Añadir feature flags para activar voice cloning sólo a ciertos usuarios.
- Script de reset mensual de charCount (cron / lambda).

---

Este roadmap refleja la brecha entre implementación actual (hash-based pool + ausencia `voice_clone_id` persistente) y el diseño objetivo (per-user voice id + LRU de priorización). La prioridad inmediata es alinear creación y persistencia del clon con la especificación en `docs/pool.md`.
