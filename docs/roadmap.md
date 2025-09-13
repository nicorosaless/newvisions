# Roadmap Backend (Servicios y Pipeline Interno)

Última actualización: 13-09-2025 (Migración a Voice Pool persistente, sin clon efímero)

## 1. Estado Actual
- ✅ Registro (`/auth/register`) y Login (`/auth/login`) (sin JWT todavía).
- ✅ Generación de pensamiento (`/generate-thought`) y audio (`/generate-audio`).
- ✅ Scripts de mantenimiento DB y generación de activation codes.
- ✅ Estructura modular base (`backend_structure.md`).
- ✅ Persistencia y normalización de `settings` (`GET/PUT /users/{id}/settings`).
- ✅ Endpoint Perform (pool): rutina → prompt → texto → estrategia de voz (provider voice_id persistente | pooled_voice_id | sample local | placeholder | TTS genérico) + actualización `charCount`.
- ❌ Clonación efímera eliminada: sustituida por pool persistente LRU (capacidad = límite tier 10) para evitar costo y latencia repetida.
- ✅ Servicio placeholder y sample de usuario (si no hay clon) siguen como fallback.
- ✅ Prompt builder integrado en /perform (usa `build_routine_prompt` + `generate_from_prompt`). (No testeado automatizado)
- ⚠️ No hay JWT ni contexto autenticado.
- ✅ Límite provisional de `charCount` = 4000 aplicado en /perform (pre y post generación). (No tests)
- ✅ Frontend: integración automática en `voice-recording.js` llamando `/perform` y mostrando tarjeta dinámica con reproductor.
- ✅ Voice clone efímero implementado (usa muestra subida del usuario como base para crear un clon temporal antes de sintetizar).
- ⚠️ Clonación asíncrona / jobs en background NO implementada (el proceso es sincrónico y bloqueante por ahora).

## 1.1 Problema Actual (Resumen Crítico)
La solución actual de clonación de voz funciona pero presenta varias limitaciones que impactan costo, latencia, calidad y robustez:

**Técnico / Arquitectura**
- Pool persistente LRU implementado (Mongo) pero sin normalización previa del audio → posibles hashes distintos por variaciones mínimas.
- No hay cola ni job async; creación de nueva voz del pool sigue siendo bloqueante.
- Necesario job de reconciliación para asegurar que no queden voces huérfanas al expulsar LRU.
- Falta de métricas detalladas (create_ms, synth_ms) para medir impacto del pool vs baseline.

**Calidad de Voz / Datos**
- Solo se usa una muestra (30–60s) sin validaciones de SNR, silencio o clipping → la calidad del clon puede ser inconsistente.
- No existe pipeline de normalización (loudness, trimming de silencios, formato uniforme antes de subir).
- No se conserva historial de calidad / puntajes; no se puede comparar mejoras futuras.

**Costos y Límites del Proveedor**
- Límite de 10 voices en ElevenLabs ahora gestionado mediante LRU (no creamos más de `capacity`).
- Evicción local elimina doc pero aún no borra recurso remoto (riesgo de fuga si llenamos el tier repetidamente) → pendiente reconciliación y delete provider.
- No se aplican rate limits internos → un usuario podría forzar rotaciones rápidas del pool.

**Fallback Chain**
- Orden actual: provider voice_clone_id → pooled_voice_id → sample crudo → placeholder → TTS genérico.
- Riesgo: sample crudo aún reproduce audio antiguo (no re-síntesis). Considerar eliminar este escalón para consistencia texto↔audio.

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

## 1.4 Plan de Mitigación Inmediata
1. Normalización + hashing estable previo a crear voz del pool (reduce clones redundantes).
2. Eliminar fallback a sample crudo o marcarlo experimental (config toggle) para coherencia.
3. Implementar JWT + rate limit (token bucket) antes de abrir a volumen > piloto.
4. Logging estructurado: métricas `pool_acquire_ms`, `pool_create_ms`, `pool_reuse_count`, `fallback_reason`.
5. Endpoint `/users/{id}/voice/meta` (estado: none|pooled|provider) para UX transparente.
6. Test integración pool: llenar hasta capacity, forzar evicción, asegurar `<= capacity`.
7. Reconciliación provider: listar voces y eliminar las que no estén en la colección local.
8. Rate limit de creación de nuevas voces por usuario (ej: 1 cada 10 min) para evitar thrash.

## 1.5 Futuro Cercano (Opciones de Evolución)
- Persistencia controlada: permitir 1 voice oficial por usuario (re-entrenable) + efímero solo como backup.
- Batch multi-muestras: permitir que el usuario suba varias muestras y crear un modelo más robusto si provider lo soporta.
- Ajustes dinámicos: mapear `stability`, `similarity`, `style` desde settings, exponer slider en UI.
- Streaming parcial de audio mientras se genera (si API lo soporta) para reducir TTFP percibido.

## 2. Voice Pool Manager (Nuevo Diseño)
Objetivo: Maximizar reutilización de hasta N (capacidad limitada por tier ElevenLabs, actualmente 10) voice IDs persistentes sin crear un clon por cada perform.

### 2.1 Concepto
- Pool LRU en Mongo (`voice_pool`): cada doc representa un voice_id persistente + hash de la muestra base normalizada.
- Clave principal: `sample_hash = sha256(muestra_preprocesada)`.
- Reuso: si un usuario con la misma muestra (hash idéntico) solicita perform, se reusa ese voice_id.
- Evicción: cuando `count >= capacity`, se elimina el LRU (menor `last_used_at`).
- TTL inactividad: voces no usadas en X minutos se purgan (limpieza periódica / on-demand).

### 2.2 Flujo /perform revisado
1. Recuperar muestra del usuario (si existe).
2. Intentar adquirir voz del pool (`acquire_voice`).
  - Si retorna voice_id → sintetizar directamente.
  - Si retorna None y capacidad no saturada → crear voz persistente, luego `register_new_voice`.
  - Si retorna None y capacidad saturada → ya se expulsó LRU, crear nueva y registrar.
3. Si falla creación/provider → sample crudo → placeholder → TTS genérico.

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

### 2.6 Tareas (Backlog)
- [ ] Normalización audio antes de hash (loudness, trim silencios)
- [ ] Endpoint mantenimiento: `POST /admin/voice-pool/cleanup`
- [ ] Métricas: `pool_reuse_count`, `pool_evictions_total`, `pool_create_total`
- [ ] Guardar `provider_delete_status` al evictar (para auditoría)
- [ ] Reconciliación programada (listar voices provider vs colección local)
- [ ] Test integración simulado (llenar pool, evictar, reutilizar)
- [ ] Toggle runtime (desactivar pool vía config sin reiniciar – requiere almacenar flag en DB o cache)

### 2.7 Futuras Optimizaciones
- Estrategia híbrida LRU+LFU (score = recency * frecuencia).
- Pre-warm de voces de usuarios activos recientes.
- Clustering de muestras para compartir un mismo voice_id entre usuarios similares.


---

- ⚠️ Testing automático pendiente (unit / integration) especialmente para Perform y migración settings.

## 2. Objetivos de Corto Plazo (Backend / Frontend Inmediatos)
1. Refrescar créditos (charCount) en frontend tras `/perform` (actualizar UI de tokens / home).
2. (COMPLETADO) Endpoint `POST /users/{id}/voice` subida & validación tamaño; almacena `recordedVoice`.
3. Helper `with_temp_voice_clone` → Perform v2.
4. Migrar a JWT (emisión y dependencia `current_user`).
5. Tests mínimos (perform: límite 4000, rutina desconocida, vacío; settings normalización; meta endpoint).
6. Métricas + logging estructurado (latency, chars_used, errores).
7. Validación manual de calidad de prompts y ajustes.

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
- [x] Perform v1 (sin clon efímero) implementado
- [x] charCount update (incremento simple)
- [x] Placeholder clone (archivo estático `cloningvoice.mp3` si existe)
- [x] Límite charCount (4000) con enforcement (no testeado)
- [x] Prompt builder integrado (no testeado)
- [x] Upload voice endpoint (/users/{id}/voice) + frontend integración botón "Generate Voice Clone" (guarda base64)
- [x] Ephemeral clone helper
- [x] Perform v2 (con clon efímero + cleanup inmediato)
- [ ] JWT emit / verify
- [ ] Dependency `current_user`
- [ ] Logging estructurado + métricas
- [ ] Tests mínimos (perform / settings / límites)
- [ ] Refresco créditos frontend

## 9. Notas Futuras / Testing Pendiente
- Validar manualmente /perform con distintos `routine_type` (edge: desconocido → error esperado 400 si aplicamos validación futura).
- Añadir asserts sobre incremento charCount consistente.
- Confirmar fallback correcto cuando falta `cloningvoice.mp3`.
- Migrar conexiones Mongo a pool central (`database.py`).
- Evaluar streaming parcial de audio (chunked) si la latencia aumenta.
- Añadir feature flags para activar voice cloning sólo a ciertos usuarios.
- Script de reset mensual de charCount (cron / lambda).

---

Este roadmap sirve como guía incremental hacia un MVP con voz personalizada. IMPORTANTE: La parte de clon real de voz y pruebas automatizadas sigue PENDIENTE; el servicio actual utiliza sólo un placeholder estático para test.
