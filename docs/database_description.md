# Database Description - voicememos_db

## 📊 Database Overview

- **Database Name**: `voicememos_db`
- **Collections**: 2
- **Total Documents**: 59
- **Analysis Date**: 2025-09-12 18:49:44 (actualizado: 2025-09-12)
- **MongoDB URI**: Atlas Cluster (mongodb+srv://...)

## 📋 Collections Schema

### 🎯 Collection: `activation_codes`

**Descripción**: Almacena códigos de activación para registro de nuevos usuarios y recuperación de contraseñas.

**Campos:**

- **_id**: `ObjectId` - ID único de MongoDB para cada código
- **code**: `str` - Código de activación alfanumérico de **11 caracteres** (ej: `123456789`, `A345j853Sr2`) - **Obligatorio: combina letras y números**
- **used**: `bool` - Indica si el código ya fue utilizado
- **used_at**: `datetime` (nullable) - Fecha y hora cuando se usó el código
- **used_by**: `ObjectId` (nullable) - ID del usuario que usó el código
- **used_for_password_reset**: `bool` (nullable) - Indica si se usó para reset de contraseña
- **password_reset_at**: `datetime` (nullable) - Fecha del reset de contraseña
- **password_reset_by**: `ObjectId` (nullable) - Usuario que realizó el reset

**Estadísticas:**
- Total de documentos: 53

---

### 🎯 Collection: `users`

**Descripción**: Almacena información completa de los usuarios registrados en la aplicación.

**Campos:**

- **_id**: `ObjectId` - ID único de MongoDB para cada usuario
- **username**: `str` - Nombre de usuario único (ej: `Nicolas`, `alexlatorre`)
- **email**: `str` - Email único del usuario (ej: `nirogo06@gmail.com`)
- **password**: `bytes` - Contraseña hasheada con bcrypt
- **created_at**: `datetime` - Fecha de creación de la cuenta
- **voice_clone_id**: `str | NoneType` - ID del clon de voz en ElevenLabs (ej: `J1LzJGFgrmgmOluMIist`)
- **charCount**: `int` (nullable) - Contador de caracteres usados en el mes
- **recordedVoice**: `bytes` (nullable) - Datos binarios del audio grabado
- **settings**: `dict` (nullable) - Configuraciones personalizadas del usuario

**Estadísticas:**
- Total de documentos: 6

---

## 🔧 Estructura Detallada del Campo `settings`

Basado en los documentos analizados, el campo `settings` contiene:

```json
{
    "language": "english",           // Idioma preferido
    "voice_similarity": 0.85,        // Similitud de voz (0.0 - 1.0)
    "stability": 0.7,               // Estabilidad de voz (0.0 - 1.0)
    "add_background_sound": true,    // Agregar sonido de fondo
    "background_volume": 0.5,        // Volumen del sonido de fondo (0.0 - 1.0)
    "sex": "male",                   // Género del usuario ("male" | "female")
    "OS": "ios"                      // Sistema operativo ("android" | "ios")
}
```

**Campos del settings:**
- **language**: `str` - Idioma para generación de contenido (`english`, `spanish`)
- **voice_similarity**: `float` - Qué tan similar suena a la voz original (0.0-1.0)
- **stability**: `float` - Estabilidad de la voz generada (0.0-1.0)
- **add_background_sound**: `bool` - Si agregar sonido ambiental
- **background_volume**: `float` - Volumen del sonido de fondo (0.0-1.0)
- **sex**: `str` - Género del usuario (`male` | `female`)
- **OS**: `str` - Sistema operativo del dispositivo (`android` | `ios`)

---

## 📈 Relaciones entre Colecciones

### User → Activation Codes
- Un usuario puede usar múltiples códigos de activación
- `users._id` ↔ `activation_codes.used_by`
- `users._id` ↔ `activation_codes.password_reset_by`

### User → Voice Cloning
- Un usuario tiene una voz clonada principal
- `users.voice_clone_id` → ElevenLabs Voice ID
- `users.recordedVoice` → Audio original grabado por el usuario

---

## 🎯 Casos de Uso Identificados

### 1. **Registro de Usuario**
```javascript
// Flujo: Código de activación → Usuario creado
activation_codes.used = true
activation_codes.used_by = user._id
activation_codes.used_at = Date.now()
```

### 2. **Gestión de Voz**
```javascript
// Después de clonar voz
users.voice_clone_id = elevenlabs_voice_id

// Mantener audio grabado
users.recordedVoice = audio_binary_data
```

### 3. **Control de Uso**
```javascript
// Después de generar audio
users.charCount += generated_chars
if (users.charCount > MONTHLY_LIMIT) {
        // Bloquear generación
}
```

### 4. **Configuración de Usuario**
```javascript
// Actualizar settings con nuevos campos
users.settings = {
        language: "english",
        voice_similarity: 0.85,
        stability: 0.7,
        add_background_sound: true,
        background_volume: 0.5,
        sex: "male",        // Nuevo campo
        OS: "ios"          // Nuevo campo
}
```

---

## 🔍 Consideraciones para el Desarrollo

### Campos Obligatorios
- `_id`, `username`, `email`, `password`, `created_at`

### Campos Opcionales con Lógica
- `voice_clone_id`: null hasta que se clone la voz
- `settings`: null hasta que se configuren preferencias
- `charCount`: 0 por defecto, se inicializa en primer uso
- `recordedVoice`: null hasta que se grabe audio

### Nuevos Campos en Settings
- `sex`: "male" | "female" (requerido en settings)
- `OS`: "android" | "ios" (requerido en settings)

### Validaciones Importantes
- `username` y `email`: únicos en la colección
- `code` en `activation_codes`: único, **exactamente 11 caracteres alfanuméricos**
- `voice_clone_id`: debe ser válido en ElevenLabs API
- `charCount`: no debe exceder límite mensual (5000)
- `settings.sex`: solo valores "male" o "female"
- `settings.OS`: solo valores "android" o "ios"

### Índices Recomendados
```javascript
// Ya existentes en el código original
db.users.createIndex({ "username": 1 }, { unique: true })
db.users.createIndex({ "email": 1 }, { unique: true })
db.activation_codes.createIndex({ "code": 1 }, { unique: true })

// Recomendados adicionales
db.users.createIndex({ "voice_clone_id": 1 })
db.activation_codes.createIndex({ "used": 1 })
db.activation_codes.createIndex({ "used_at": 1 })

// Nuevos índices para campos de settings
db.users.createIndex({ "settings.sex": 1 })
db.users.createIndex({ "settings.OS": 1 })
```

---

## 📝 Notas de Desarrollo

### Cambios Recientes (12 de septiembre de 2025)
- **Eliminados**: `loggedIn`, `loggedInDevice`, `lastCharReset`, `voice_ids`
- **Agregados**: `sex` y `OS` en el campo `settings`
- **Mantenido**: `recordedVoice` para almacenamiento de audio grabado

### Consideraciones Técnicas
- **Tipos de Datos**: Mezcla de tipos nativos de Python y MongoDB (ObjectId, datetime, bytes)
- **Campos Binarios**: `password` y `recordedVoice` almacenan datos binarios
- **Fechas**: Todas las fechas están en UTC
- **Encoding**: Los strings están en UTF-8
- **Nulabilidad**: Varios campos pueden ser null dependiendo del estado del usuario
- **Validaciones de Settings**: Los campos `sex` y `OS` tienen valores enumerados restrictivos
- **Códigos de Activación**: Deben ser exactamente 11 caracteres alfanuméricos (letras y números)

### Campos de Settings con Validación
- `sex`: Solo acepta "male" o "female"
- `OS`: Solo acepta "android" o "ios"
- Ambos campos son requeridos cuando se crea el objeto settings

### Formato de Códigos de Activación
- **Longitud**: Exactamente 11 caracteres
- **Caracteres**: Alfanuméricos (letras A-Z, a-z y números 0-9)
- **Ejemplos válidos**: `A1B2C3D4E5F`, `123456789AB`, `XyZ98765432`
- **Ejemplos inválidos**: `123456789` (muy corto), `ABCDEFGHIJKL` (muy largo), `ABC123!@#` (caracteres especiales)

---

*Documentación actualizada el 12 de septiembre de 2025 con especificaciones de códigos de activación*

