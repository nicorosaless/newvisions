# Roadmap Backend (Servicios y Pipeline Interno)

Última actualización: 14-09-2025 (Tarjeta inmediata All Recordings con título/fecha settings cacheados + actualización instantánea de créditos tras /perform + factor coste modelo expuesto en /health + prefetch settings en login + eliminación placeholder "Generating thought..." + charsUsedRaw/effective en respuesta perform + corrección uso modelo turbo en todas las rutas, incluyendo cloning)

## 1. Estado Actual
- ✅ Registro (`/auth/register`) y Login (`/auth/login`) (sin JWT todavía)
- ✅ Generación de pensamiento (`/generate-thought`) y audio (`/generate-audio`)
- ✅ Scripts de mantenimiento DB y generación de activation codes
- ✅ Estructura modular base (`backend_structure.md`)
- ✅ Persistencia y normalización de `settings` (`GET/PUT /users/{id}/settings`)
- ✅ Refactor Voice Pool: ahora per-user `voice_id` LRU (eliminado `sample_hash` y multi-usuario)
- ✅ Creación clon persistente (stub o provider) en el momento del upload inicial de la muestra (eager) y persistencia en `users.voice_clone_id`
- ✅ Endpoint `/perform` estricto: requiere clon persistente (crea si existe sample; 409 si no hay sample ni clon) sin fallbacks degradados
- ✅ Prompt seguro tipo "voice note" integrado en `/perform` (`build_voice_note_prompt`) reemplazando builder previo
- ✅ Logging estructurado básico de prompt (`gemini_prompt_built`) y texto generado (`gemini_text_generated`)
- ✅ Voice settings dinámicos (stability, similarity, style heuristic) aplicados a ElevenLabs en tiempo de síntesis
- ✅ Logging de voice settings aplicados (`voice_clone_settings`)
- ✅ Lógica de promoción de stub → clon real (`promote_stub_to_real_clone`) cuando aparece API key
- ✅ Lógica de actualización de clon real creando nueva voz (`update_existing_real_clone`) preservando `voice_clone_previous_id`
- ✅ Respuesta de upload con campo `action` (created_stub|created_real|promoted_stub|updated_real|update_skipped|...)
- ✅ Eliminados: clon efímero por request y fallback a sample crudo como ruta de éxito
- ✅ Endpoint `/users/{id}/voice/meta` (estado de clon y sample)
- ✅ Endpoint `/users/{id}/voice/source` (recuperar sample MP3 almacenado)
- ✅ UI Voice Clone condicional: muestra sample existente y botón "Update Voice Sample" si ya hay clon; flujo de grabación original si no existe
- ✅ Gating frontend botón Perform: bloquea acceso a selección de rutinas sin clon creado
- ✅ Botón "Edit" en pantalla All Recordings ahora redirige a Home (back temporal mientras se implementa modo edición real)
- ✅ Touch explícito del pool al pulsar Perform (`POST /users/{id}/voice/pool/touch`) asegurando que el `voice_clone_id` queda como MRU antes de seleccionar rutina
- ✅ Respuesta de touch incluye `position` (0 = MRU) y `size` para debugging
- ✅ Error 409 estructurado (`VOICE_CLONE_REQUIRED`) con acción sugerida
- ✅ Límite provisional `charCount` = 4000 (enforced)
- ✅ Prefetch de user settings tras login (cache en cookies) para título/fecha instantáneos en All Recordings
- ✅ Tarjeta de nueva grabación creada inmediatamente al entrar a All Recordings (solo se actualiza duración al recibir audio)
- ✅ Eliminado placeholder "Generating thought..." (UX consistente)
- ✅ Actualización inmediata de créditos UI usando respuesta `/perform` (charCount/monthlyLimit)
- ✅ Campos `charsUsedRaw` y `charsUsedEffective` agregados al schema PerformResponse (debug de coste)
- ✅ Exposición en `/health` del `elevenlabs_model` y `model_cost_factor`
- ✅ Alineación modelo turbo (eleven_turbo_v2_5) en síntesis estándar y voice cloning
- ❗ Pendiente integrar endpoint `/v1/user/subscription` (requiere permiso `user_read`) para confirmar programáticamente `voice_limit` y ajustar pool / límites dinámicos
- 🛈 Planificación introducción factor coste por modelo ElevenLabs (multilingual vs turbo) para cálculo preciso de créditos
- ⚠️ Falta normalización previa (loudness / silencio) antes de creación real (aunque ya se envía MP3 a ElevenLabs y existen flujos de creación, promoción y actualización)
- ⚠️ Falta limpieza / eliminación remota de voice_ids antiguos tras update o evicción
- ⚠️ Sin JWT ni rate limiting
- ⚠️ Métricas y logging estructurado mínimos (solo prints)
- ⚠️ Sin pipeline de normalización avanzada (loudness / silencio) antes de clonar
- ⚠️ Sin métricas pool (reuse / evict / create)
- ⚠️ Sin tests dedicados a pool y endpoints meta/source

## 1.1 Brecha Pendiente Principal
La arquitectura base (clon persistente + pool LRU per-user + gating Perform) ya está alineada con especificación. Falta la integración completa con ElevenLabs para crear (y opcionalmente re-entrenar) el clon REAL usando el MP3 del usuario:
1. Enviar el payload (multipart con MP3) al endpoint real de creación la primera vez (si hay API key y no stub mode).
2. Definir política de actualización: hoy actualizar sample sólo reemplaza `recordedVoiceBinary` pero NO re-crea el clon (re-entrenamiento pending).
3. Añadir pipeline de normalización antes de subir al provider (loudness, trim silencios, validación duración real vs declarada).
4. Registrar métricas de tiempos y resultado (éxito / fallo) para la creación.
5. Manejar errores de proveedor con backoff y surfaced error codes (no sólo stub fallback).
6. Borrado remoto diferido en evicciones futuras (cuando se llene el capacity y se pase a borrar voces reales).

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

## 1.4 Plan de Mitigación Inmediata (Actualizado)
1. Pipeline de normalización previo + hash sobre audio normalizado.
2. Métricas detalladas (pool reuse/evict, create_latency_ms, clone_create_fail_total, TTS latency) y structured logging completo.
3. JWT + rate limiting de endpoints sensibles (`/users/{id}/voice`, `/perform`).
4. Endpoint admin observabilidad pool (estado, tamaño, reuse ratio, evictions).
5. Tests adicionales: meta/source endpoints, gating perform (409), pool LRU (evict + reinserción), promoción y update real.
6. Borrado remoto diferido de voces sustituidas (limpieza de `voice_clone_previous_id`) y evicciones.
7. Clasificación unificada de errores (`error`, `message`, `action`) y códigos específicos.
8. Mejora UI "All Recordings": listado enriquecido (timestamp, duración, estado clon, acción update) y reproducción inline.
9. Validación de que el topic no aparezca literal en el texto (heurística post-Gemini) para reforzar instrucción.

## 1.5 Futuro Cercano (Opciones de Evolución)
- Persistencia controlada: permitir 1 voice oficial por usuario (re-entrenable) + efímero solo como backup.
- Batch multi-muestras: permitir que el usuario suba varias muestras y crear un modelo más robusto si provider lo soporta.
- Ajustes dinámicos: mapear `stability`, `similarity`, `style` desde settings, exponer slider en UI.
- Streaming parcial de audio mientras se genera (si API lo soporta) para reducir TTFP percibido.

## 2. Voice Pool Manager (LEGACY vs Nuevo Provider-Backed)
LEGACY (Mongo `voice_pool`): mantenía documentos con `last_used_at` y hacía touch en cada perform. Generaba doble fuente de verdad y costo operativo.

NUEVO (Provider-Backed – especificado en `docs/pool.md`):
- Fuente de verdad = voces reales en ElevenLabs.
- In-memory LRU efímero (no persistido) con reconstrucción en startup.
- Evicción = delete remoto (slot liberado real).
- Renombrado inmediato `name = voice_id` tras creación.
- Usuario que apunta a voz borrada → 409 `VOICE_CLONE_REQUIRED` y re-clone.

Estado: Diseño documentado. Implementación pendiente (ver Sección 2.8 Migración Pool Provider-Backed).

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
- [x] Crear clon estable en upload y persistir `voice_clone_id`
- [x] Refactor pool per-user (clave `voice_id`), eliminar `sample_hash` / lista `users`
- [x] Endpoint `GET /users/{id}/voice/meta`
- [x] Endpoint `GET /users/{id}/voice/source`
- [x] Gating perform (frontend) sin clon → bloquea y sugiere grabar
- [x] Error 409 estructurado `VOICE_CLONE_REQUIRED`
- [x] UI condicional Voice Clone (reproduce sample existente / update sample)
- [x] Endpoint touch pool (`/users/{id}/voice/pool/touch`) + integración frontend (MRU antes de rutinas)
- [ ] Normalización audio previa + hashing estable
- [ ] Métricas pool (reuse / evict / size / latency)
- [ ] Endpoint observabilidad pool `/admin/voice-pool/status`
- [ ] Evicción remota diferida + reconciliación programada
- [ ] JWT + rate limiting
- [ ] Logging estructurado JSON (ampliar más allá de prints actuales)
- [ ] Tests integrales pool + meta/source + gating + promoción/update
- [ ] Feature flag `POOL_ENABLED`
- [ ] Script limpieza legado pool antiguo (si quedan docs previos)
- [ ] UI "All Recordings" mejora display (metadatos, controles, estado clon)
- [ ] Integrar lectura `/v1/user/subscription` (permiso `user_read`) y actualizar `elevenlabs_pool_capacity` dinámicamente
- [x] (Actualizado) Factor coste por modelo aplicado vía `docs/elevenlabs_models_cost.json` y cálculo centralizado (ya no se usa `ELEVEN_LABS_MODEL_COST_FACTOR`)

### 2.6.2 (Nuevo) Provider-Backed Pool (Migración)
- [ ] Feature flag `PROVIDER_POOL_ENABLED`
- [ ] Módulo `provider_pool` (structures, ensure_capacity_then_create, evict_one)
- [ ] Servicio creación clon real: rename inmediato `voice.name = voice_id`
- [ ] Campo `user.last_perform_at` (persist) + actualización async en `/perform`
- [ ] Actualizar pipeline `/perform` para validar existencia voz vía provider si falta en cache
- [ ] Job reconciliación (detectar missing/orphaned, retry deletions, rename corrections)
- [ ] Métricas pool nuevas (size, evictions, creations, latency)
- [ ] Logs estructurados (voice_created, voice_evicted, voice_missing_detected, voice_rename_retry)
- [ ] Estrategia de fallback: si creación falla -> error surfaced (no recrear silenciosamente)
- [ ] Script migración: drop colección Mongo `voice_pool` (post estabilización)
- [ ] Retirar endpoint legacy touch (si ya no aporta valor)
- [ ] Actualizar documentación cliente (frontend) sobre eliminación de touch explícito
- [ ] Tests: creación con capacity-1, creación con capacity llena (evict), perform voz inexistente (409), reconciliación repone estado

Checklist Validación Pre-Drop Legacy:
- [ ] `voice_pool_current_size == len(list_provider_voices())` durante 24h
- [ ] Cero entradas `deletion_pending` tras 3 ciclos de reconciliación
- [ ] Tasa de errores creación < 2% en ventana 24h
- [ ] Métrica evictions esperada (no > creations * 0.9) evitando thrash

De-Soporte Legacy:
- [ ] Remover código `voice_pool` Mongo y modelos asociados
- [ ] Eliminar variables entorno relacionadas (POOL_ENABLED, etc.) sustituidas por `PROVIDER_POOL_ENABLED`
- [ ] Documentar en CHANGELOG ruptura menor (migración automática)

Nota compatibilidad variables entorno (14-09-2025):
El backend ahora acepta ambas `ELEVEN_LABS_MODEL` (preferida) y `ELEVENLABS_MODEL` (legado) para seleccionar el modelo activo. El endpoint `/health` expone `elevenlabs_model` y `model_cost_factor`.

### 2.6.1 Detalle Mejora UI "All Recordings" (Nuevo)
Objetivo: Convertir la vista en un panel auditivo navegable que facilite revisión rápida, depuración y re-grabación.

Elementos propuestos (MVP incremental):
- Lista ordenada por `created_at` descendente (más reciente arriba) con fallback a nombre/ID si falta fecha.
- Metadatos visibles: timestamp legible, duración (mm:ss), tamaño KB, estado (sample | clon_promovido | clon_actualizado), fuente (`voice_clone_id` parcial / stub / real).
- Indicadores: badge si el clip fue usado para crear/promocionar un clon; icono si es la muestra activa.
- Controles inline: reproducir/pausar, botón Update (abre flujo reemplazo), copiar ID.
- Feedback estados: loading skeleton al cargar, placeholder vacío con CTA para grabar primera muestra.
- Gestión errores: toast o inline error (ej. fallo fetch audio) con opción reintentar.
- Accesibilidad: foco teclado, aria-label en botones, espacio para transcripción futura.
- Preparado para futura paginación (carga lazy si > N items) y filtrado (ej. solo activos / históricos).

Backlog específico (derivado):
- [ ] Endpoint (si falta) para listar recordings con metadatos (duración calculada server side)
- [ ] Adaptar frontend: componente `RecordingList` con estado `loading | ready | empty | error`
- [ ] Añadir cálculo duración server (leer headers MP3 o preprocesar y cachear)
- [ ] Agregar campo `is_active_sample` y `clone_state` en respuesta
- [ ] Botón Update reuse flujo ya existente (cierra modal al éxito y refresca lista)
- [ ] Incorporar iconografía simple (🎙 activo, ⭐ clon actual)
- [ ] Tests UI básicos (render lista vacía / con items)
- [ ] (Opcional) Precalcular waveform ligero (array normalizado) para futura vista

Nota: Esta mejora no bloquea la generación de audio (ya operativa) pero incrementa claridad operativa y reduce confusión del usuario sobre qué muestra está en uso.

Corrección aplicada (14-09-2025): Eliminado `routine_type` del subtítulo en tarjetas generadas y ahora se usa `voice_note_name` / `voice_note_date` de settings para el título y fecha si están definidos. Además, el título/fecha se obtienen desde cookies (prefetch login) evitando latencia perceptible antes de mostrar la tarjeta.

Mejora adicional (14-09-2025): Implementada función `mix_with_fan` en pipeline de audio que permite mezclar la voz clonada con sonido de ventilador (o ruido marrón sintético fallback) controlando el volumen con `fan_volume_pct`. Base lista para futura exposición en settings de usuario. Añadida integración UX: sin spinner textual, la única transición visible es la aparición de la duración.

### 2.7 Futuras Optimizaciones
- Estrategia híbrida LRU+LFU (score = recency * frecuencia).
- Pre-warm de voces de usuarios activos recientes.
- Clustering de muestras para compartir un mismo voice_id entre usuarios similares.
- Auto-ajuste de capacidad basada en `/v1/user/subscription.voice_limit` en tiempo real.


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
| 1 | Safe Voice Note Prompt | Integrado (build_voice_note_prompt) | Perform v1 | ✅ |
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
- [x] `/perform` estricto (sin fallback sample crudo)
- [x] Límite charCount (4000) enforcement
- [x] Upload voice endpoint (sample MP3 + creación clon persistente stub/real)
- [x] Eliminado placeholder estático y clon efímero
- [x] Creación clon estable en upload
- [x] Persistir `voice_clone_id` en user tras creación
- [x] Refactor pool per-user voice_id
- [x] Remover fallback sample crudo (éxito) (sólo error 409/502 ahora)
- [x] Endpoint `voice/meta`
- [x] Endpoint `voice/source`
- [x] Gating Perform frontend
- [x] UI Voice Clone condicional
- [x] Endpoint touch pool + MRU perform gating
- [x] Safe prompt voice note integrado
- [x] Prefetch settings + creación inmediata tarjeta All Recordings
- [x] Créditos UI en vivo tras perform (sin recarga)
- [x] Campos charsUsedRaw/effective en PerformResponse
- [x] Voice settings dinámicos → ElevenLabs
- [x] Logging prompt y settings
- [x] Promoción stub → real
- [x] Update clon real creando nuevo voice_id
- [ ] Normalización audio previa
- [ ] Métricas & logging estructurado pool
- [ ] JWT + dependencia usuario
- [ ] Rate limiting creación clon
- [ ] Tests pool + meta/source + gating + promoción/update
- [ ] Endpoint admin pool status
- [ ] Evicción remota + reconciliación
- [ ] Limpieza voices previas (voice_clone_previous_id)
- [ ] UI All Recordings mejora display

## 9. Notas Futuras / Testing Pendiente
- Validar manualmente /perform con distintos `routine_type` (edge: desconocido → error esperado 400 si aplicamos validación futura).
- Añadir asserts sobre incremento charCount consistente.
- Confirmar fallback correcto cuando falta `cloningvoice.mp3`.
- Migrar conexiones Mongo a pool central (`database.py`).
- Evaluar streaming parcial de audio (chunked) si la latencia aumenta.
- Añadir feature flags para activar voice cloning sólo a ciertos usuarios.
- Script de reset mensual de charCount (cron / lambda).

---

Este roadmap ahora refleja el estado tras la alineación base (clon persistente + pool per-user + gating). La prioridad inmediata: creación real de clon ElevenLabs con el MP3 del usuario y normalización previa, seguida de métricas, autenticación y observabilidad.
