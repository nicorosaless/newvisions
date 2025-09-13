# Roadmap Backend (Servicios y Pipeline Interno)

Última actualización: 13-09-2025

## 1. Estado Actual
- ✅ Registro (`/auth/register`) y Login (`/auth/login`) funcionales (sin JWT aún).
- ✅ Generación de pensamiento (`/generate-thought`) y audio (`/generate-audio`) básica.
- ✅ Scripts de mantenimiento DB y generación de activation codes.
- ✅ Estructura modular base (`backend_structure.md`).
- ⚠️ Falta persistencia de `settings` por usuario.
- ⚠️ Falta pipeline completo de Perform (thought → clone efímero → audio → cleanup).
- ⚠️ No hay JWT ni contexto de usuario autenticado en endpoints internos.
- ⚠️ `charCount` no se actualiza ni se limita.
- ⚠️ No hay autorización granular ni validación de pertenencia de recursos.

## 2. Objetivos de Corto Plazo (Backend / Prioridad Alta)
1. Persistencia de settings usuario (`GET/PUT /user/settings`).
2. Autenticación con JWT (emisión y validación) + dependencia `current_user`.
3. Endpoint `POST /user/voice` (upload binario -> `recordedVoice`).
4. Pipeline Perform v1 (`POST /perform` thought + audio sin clon efímero todavía si no hay voice).
5. charCount: actualización e imposición de límite (5000 default).
6. Perform v2 con clon efímero y cleanup.

## 3. Backlog Secuenciado
| Fase | Ítem | Descripción | Dependencias |
|------|------|-------------|--------------|
| 1 | JWT Auth | Generar y validar tokens | Login existente |
| 1 | Settings Save | Persistir settings usuario | JWT |
| 1 | GET Settings | Devolver settings usuario | Settings Save |
| 2 | Upload Voice | Guardar `recordedVoice` | JWT |
| 2 | Perform Endpoint (v1) | Thought + Audio (sin clon efímero) | Upload Voice (opcional) |
| 2 | charCount Update | Sumar caracteres generados | Perform v1 |
| 3 | Ephemeral Clone Helper | Abstracción `with_temp_voice_clone` | Upload Voice |
| 3 | Perform (v2) | Thought + clone efímero + cleanup | Helper |
| 3 | Rate Limits / Quotas | Límites adicionales (ráfaga/minuto) | charCount |
| 4 | Settings Enriched | Ajustar parámetros voz dinámicamente | Settings base |
| 4 | Audio Streaming (Opcional) | Stream parcial de audio | Perform v2 |
| 5 | Metrics & Logging | Latencia, fallos, auditoría | Pipeline estable |
| 5 | Cleanup Cron | Borrado clones huérfanos + reset mensual | Perform v2 |

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
- v2: implementa helper:
  ```python
  def with_temp_voice_clone(user, func):
      clone_id = create_temp_clone(user.recordedVoice)
      try:
          return func(clone_id)
      finally:
          delete_voice_clone(clone_id)
  ```
- Ajustar `audio_service` para aceptar parámetros dynamic voice settings.

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

## 8. Checklist Resumido (Sólo Backend)
- [ ] JWT emit / verify
- [ ] Dependency `current_user`
- [ ] Endpoints settings (GET/PUT)
- [ ] Upload voice endpoint
- [ ] Perform v1 (sin clon efímero)
- [ ] charCount update + limit
- [ ] Ephemeral clone helper
- [ ] Perform v2 (con clon efímero)
- [ ] Logging estructurado + métricas

## 9. Notas Futuras
- Migrar conexiones Mongo a pool central (`database.py`).
- Añadir tests unitarios para perform y settings.
- Evaluar streaming parcial de audio (chunked) si la latencia aumenta.
- Añadir feature flags para activar voice cloning sólo a ciertos usuarios.

---

Este roadmap sirve como guía incremental para cerrar la brecha entre la estructura actual y un MVP completo con personalización de voz y uso controlado.
