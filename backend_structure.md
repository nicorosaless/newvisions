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
- **Separación de responsabilidades**: Cada módulo tiene una función específica
- **Bajo acoplamiento**: Los módulos son independientes entre sí
- **Alta cohesión**: Cada módulo contiene todo lo relacionado con su responsabilidad
- **Escalabilidad**: Fácil agregar nuevos módulos sin afectar los existentes

### Módulos Principales

#### 1. **services/config/** - ⚙️ Configuración
**Responsabilidades:**
- Carga de variables de entorno (.env)
- Configuración de APIs externas (ElevenLabs, Gemini)
- Conexión a base de datos MongoDB
- Inicialización de modelos y voces por defecto

**Archivos futuros:**
- `settings.py` - Configuración centralizada
- `database.py` - Conexión MongoDB
- `external_apis.py` - Configuración APIs externas

#### 2. **services/auth/** - 🔐 Autenticación
**Responsabilidades:**
- Sistema JWT completo
- Decorador `@token_required`
- Hashing de contraseñas (bcrypt)
- Validación de tokens y sesiones

**Archivos futuros:**
- `jwt_handler.py` - Gestión de tokens JWT
- `password_utils.py` - Utilidades de contraseñas
- `auth_service.py` - Lógica de autenticación

#### 3. **services/users/** - 👥 Gestión de Usuarios
**Responsabilidades:**
- Registro y login de usuarios
- Validación de emails
- Perfiles de usuario
- Configuraciones personalizadas
- Estado de login/logout

**Archivos futuros:**
- `user_service.py` - Lógica de usuarios
- `user_repository.py` - Acceso a datos de usuarios
- `user_models.py` - Modelos específicos de usuario

#### 4. **services/activation/** - 🎫 Códigos de Activación
**Responsabilidades:**
- Validación de códigos únicos
- Gestión de códigos usados
- Reset de contraseñas
- Vinculación usuario-código

**Archivos futuros:**
- `activation_service.py` - Lógica de códigos
- `activation_repository.py` - Acceso a datos de códigos

#### 5. **services/voice_cloning/** - 🎤 Clonación de Voz
**Responsabilidades:**
- Subida y procesamiento de archivos de audio
- Integración con ElevenLabs Voice Cloning API
- Gestión de voice_ids por usuario
- Eliminación de clones existentes

**Archivos futuros:**
- `voice_service.py` - Lógica de clonación
- `file_handler.py` - Gestión de archivos de audio

**Nueva Lógica (Ephemeral Voice Clone Workflow):**
- El `voice_clone_id` **NO** se almacena de forma permanente.
- Sólo se crea cuando el usuario pulsa el botón "perform" (acción de generación de audio con voz clonada).
- Flujo detallado:
    1. Validar que el usuario tiene `recordedVoice` disponible y configuraciones en `settings`.
    2. Crear un clon temporal en ElevenLabs usando el audio base (`recordedVoice`).
    3. Guardar transitoriamente el `voice_clone_id` (en memoria o campo efímero en la sesión; opcionalmente en el documento del usuario pero inmediatamente marcado para borrado).
    4. Generar el audio solicitado usando ese `voice_clone_id`.
    5. Tras generación exitosa (o fallo controlado), llamar a la API de ElevenLabs para **eliminar** el clon y liberar uno de los 10 slots.
    6. Limpiar cualquier referencia a `voice_clone_id` en la base de datos (dejarlo en `null`).
    7. Incrementar `charCount` y aplicar límites de uso.
    8. Registrar métricas (tiempo de generación, tamaño del audio, intentos, errores).
- Objetivo: Nunca acumular clones y evitar alcanzar el límite de 10 voces clonadas.
- Consideraciones de Concurrencia:
    - Si el usuario dispara múltiples "perform" casi simultáneamente, serializar o poner un lock por usuario (p.ej. `Redis` lock o flag en memoria) para evitar clones superpuestos.
    - Reintentos: si la generación falla después de crear el clon, se debe intentar siempre el borrado de cleanup (bloque `finally`).
- Manejo de Errores:
    - Si falla la creación del clon → devolver error y no continuar.
    - Si falla la síntesis pero el clon existe → intentar borrarlo antes de responder.
    - Si falla el borrado del clon → loggear alerta (nivel WARN) y programar un job de limpieza diferida.
- Auditoría / Logging:
    - Log estructurado: `user_id`, `request_id`, `clone_created_at`, `clone_deleted_at`, `latency_ms`.
    - Métrica: tasa de éxito vs intentos de clonación.
- Seguridad / Privacidad:
    - El audio base (`recordedVoice`) se mantiene internamente; nunca exponer binario original en endpoints públicos.
    - Evitar persistir parámetros sensibles de ElevenLabs más allá de lo necesario.
- Optimización Futuro (Opcional): Cachear embeddings locales para reducir tiempo si ElevenLabs ofrece mecanismos sin mantener clones vivos.

**Cambios en Modelo / Campo `voice_clone_id`:**
- Se interpreta como campo temporal: `None` la mayor parte del tiempo.
- Cualquier valor distinto de `None` implica un clon pendiente de usar o en proceso; procesos periódicos (cron) pueden verificar y eliminarlo si quedó huérfano.

**Puntos Técnicos para Implementación Futura:**
- Añadir `voice_cloning_lock` (en memoria) por `user_id`.
- Crear helper `with_temp_voice_clone(user, func)` que encapsule: create → use → delete → cleanup.
- Implementar pruebas de resiliencia: simular fallo entre creación y eliminación.
- Añadir métrica de duración media entre creación y eliminación (<30s ideal).

**Resumen:** La gestión de voz pasa a ser efímera y orientada a una sola operación por cada "perform", garantizando que nunca se exceda el límite de 10 clones impuesto por ElevenLabs.

#### 6. **services/content/** - 📝 Generación de Contenido
**Responsabilidades:**
- Integración con Google Gemini
- Generación de prompts inteligentes
- Filtros de contenido inapropiado
- Validación de inputs de usuario

**Archivos existentes:**
- `thought_service.py` - Servicio de pensamientos (Gemini)

**Archivos futuros:**
- `content_filter.py` - Filtros de contenido
- `prompt_builder.py` - Construcción de prompts

#### 7. **services/audio/** - 🔊 Síntesis de Audio
**Responsabilidades:**
- Endpoint principal de generación
- Parámetros de voz (estabilidad, similitud)
- Modelos de ElevenLabs
- Gestión de archivos temporales

**Archivos existentes:**
- `audio_service.py` - Servicio de audio (ElevenLabs)

**Archivos futuros:**
- `tts_service.py` - Text-to-Speech
- `audio_processor.py` - Procesamiento de audio

#### 8. **services/limits/** - 📊 Control de Uso
**Responsabilidades:**
- Contadores de caracteres mensuales
- Reset automático de límites
- Validación de cuotas
- Información de uso para usuarios

**Archivos futuros:**
- `usage_service.py` - Gestión de límites
- `quota_manager.py` - Control de cuotas

#### 9. **services/utils/** - 🛠️ Utilidades
**Responsabilidades:**
- Funciones helper de validación
- Gestión de archivos
- Logging y debugging
- Respuestas de error estandarizadas

**Archivos futuros:**
- `validators.py` - Validaciones
- `file_utils.py` - Utilidades de archivos
- `logger.py` - Sistema de logging

## 🔄 Flujo de Datos

```
Usuario → main.py → Router específico → Servicio → Respuesta
    ↓
   API
    ↓
Servicio → Base de datos / API externa → Servicio → Respuesta
```

## 📋 Estado Actual

### ✅ Implementado
- Estructura de carpetas organizada
- Archivos `__init__.py` en todos los módulos
- `audio_service.py` movido a `services/audio/`
- `thought_service.py` movido a `services/content/`
- Backend funcional con FastAPI

### 🚧 Pendiente
- Implementar cada módulo con su lógica específica
- Crear routers para cada módulo
- Integrar todos los módulos en `main.py`
- Crear modelos Pydantic específicos
- Implementar middleware y dependencias

## 🎯 Próximos Pasos

1. **Configuración inicial** - Implementar `services/config/`
2. **Autenticación** - Implementar `services/auth/`
3. **Usuarios** - Implementar `services/users/`
4. **Audio** - Refactorizar `audio_service.py` existente
5. **Contenido** - Refactorizar `thought_service.py` existente
6. **Integración** - Conectar todos los módulos en `main.py`

## 📊 Métricas de Organización

- **Módulos**: 9 módulos principales
- **Separación**: Alta cohesión, bajo acoplamiento
- **Mantenibilidad**: Código distribuido en módulos pequeños
- **Escalabilidad**: Fácil agregar nuevos módulos
- **Legibilidad**: Estructura clara y documentada

---

*Última actualización: 12 de septiembre de 2025*