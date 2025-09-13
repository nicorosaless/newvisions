# Backend Structure - New Visions

## 📁 Estructura General del Proyecto

```
newvisions/
├── backend/
│   ├── services/                    # 📦 Módulos principales organizados
│   │   ├── __init__.py
│   │   ├── config/                  # ⚙️ Configuración e inicialización
│   │   │   └── __init__.py
│   │   ├── auth/                    # 🔐 Autenticación y JWT
│   │   │   └── __init__.py
│   │   ├── users/                   # 👥 Gestión de usuarios
│   │   │   └── __init__.py
│   │   ├── activation/              # 🎫 Códigos de activación
│   │   │   └── __init__.py
````markdown
# Backend Structure - New Visions

## 📁 Estructura General del Proyecto

```
newvisions/
├── backend/
│   ├── services/                    # 📦 Módulos principales organizados
│   │   ├── __init__.py
│   │   ├── config/                  # ⚙️ Configuración e inicialización
│   │   │   └── __init__.py
│   │   ├── auth/                    # 🔐 Autenticación y JWT
│   │   │   └── __init__.py
│   │   ├── users/                   # 👥 Gestión de usuarios
│   │   │   └── __init__.py
│   │   ├── activation/              # 🎫 Códigos de activación
│   │   │   └── __init__.py
│   │   ├── voice_cloning/           # 🎤 Clonación de voz
│   │   │   └── __init__.py
│   │   ├── content/                 # 📝 Generación de contenido
│   │   │   ├── __init__.py
│   │   │   └── thought_service.py   # Servicio de pensamientos (Gemini)
│   │   ├── audio/                   # 🔊 Síntesis de audio
│   │   │   ├── __init__.py
│   │   │   └── audio_service.py     # Servicio de audio (ElevenLabs)
│   │   ├── limits/                  # 📊 Control de uso y límites
│   │   │   └── __init__.py
│   │   └── utils/                   # 🛠️ Utilidades y helpers
│   │       └── __init__.py
│   ├── main.py                      # 🎯 Punto de entrada - orquestación de routers
│   ├── api.py                       # 🌐 Endpoints principales
│   ├── config.py                    # ⚙️ Configuración global
│   ├── models.py                    # 📋 Modelos de datos Pydantic
│   ├── mongo_test.py                # 🧪 Script de prueba MongoDB
│   ├── smoke_test.py                # 🧪 Script de prueba completa
│   ├── main.py.outdated             # 📜 Versión anterior (Flask)
│   └── __pycache__/                 # 🗂️ Cache de Python
├── tmp/                             # 📁 Archivos temporales
├── .env                             # 🔑 Variables de entorno
├── requirements.txt                 # 📦 Dependencias Python
├── start_backend.sh                 # 🚀 Script de inicio
├── projectcontext.md                # 📖 Contexto del proyecto
└── backend_structure.md             # 📋 Esta documentación
```

## 🏗️ Arquitectura Modular

### Principios de Diseño
- **Separación de responsabilidades**
- **Bajo acoplamiento**
- **Alta cohesión**
- **Escalabilidad**

### Módulos Principales

#### 1. **services/config/** - ⚙️ Configuración
Responsabilidades:
- Carga env (.env), APIs externas, DB.

#### 2. **services/auth/** - 🔐 Autenticación
Responsabilidades futuras: JWT, hashing, validación tokens.

#### 3. **services/users/** - 👥 Usuarios
Registro / login / settings.

#### 4. **services/activation/** - 🎫 Activación
Gestión códigos y validación.

#### 5. **services/voice_cloning/** - 🎤 Clonación de Voz (Voice Pool Persistente)
Responsabilidades:
- Subida/transcodificación de muestra (30–60s MP3).
- Reutilización de voces clonadas (pool LRU limitado por tier ElevenLabs: capacidad configurada, default 10).
- Creación de voz persistente solo cuando no existe hash en pool.
- Fallback final: muestra cruda o TTS genérico.

Cadena de resolución en `/perform`:
1. `voice_clone_id` persistente (reservado, hoy normalmente None).
2. `pooled_voice_id` (entrada en colección `voice_pool`).
3. `recordedVoiceBinary` (sample crudo) – no re-sintetiza el texto.
4. TTS genérico.

Estructura colección `voice_pool`:
```json
{
  "voice_id": "...",
  "sample_hash": "sha256(mp3)",
  "users": ["user_id"],
  "created_at": ISODate,
  "last_used_at": ISODate,
  "reuse_count": 0,
  "bytes_len": 123456
}
```

Pendiente: normalización previa (trim silencios / loudness), borrado remoto al evictar, métricas pool.

#### 6. **services/content/** - 📝 Contenido
Generación de texto (Gemini) y prompt building.

#### 7. **services/audio/** - 🔊 Audio
Síntesis ElevenLabs genérica (TTS) y placeholders silenciosos.

#### 8. **services/limits/** - 📊 Límites
charCount y futuros resets.

#### 9. **services/utils/** - 🛠️ Utilidades
Validaciones, logging, helpers.

## 🔄 Flujo de Datos
```
Usuario → API Router → Servicio → DB / Provider → Respuesta
```

## 📋 Estado Actual
### ✅ Implementado
- Estructura modular
- Integración básica FastAPI
- `audio_service.py` y `thought_service.py` reubicados
- Voice Pool LRU básico (sin normalización todavía)
- Tests básicos `/perform` (validación flujo y límites)

### 🚧 Pendiente
- JWT & dependencia de usuario
- Normalización audio previa a hash pool
- Métricas / logging estructurado pool
- Rate limiting creación de voces
- Limpieza remota voces evictadas

## 🎯 Próximos Pasos
1. JWT + auth middleware
2. Normalización + hash estable para pool
3. Métricas (reuse, create, evict) y dashboards
4. Rate limit y cooldown de creación
5. Reconciliación provider vs colección local

## 📊 Métricas (Planeadas)
- `pool_create_total`, `pool_reuse_total`, `pool_evictions_total`
- `perform_latency_ms`, `chars_generated_total`

## Resumen Cambio Clave
Se reemplaza clon efímero por pool persistente (LRU) para reducir latencia y uso de slots. Eliminado placeholder estático y helper efímero.

---

*Última actualización: 13 de septiembre de 2025*
````