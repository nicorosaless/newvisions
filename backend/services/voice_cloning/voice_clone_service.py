import base64
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple, Dict, Callable, Any
from pymongo import MongoClient  # type: ignore
from backend.config import settings
from .voice_pool import get_voice_pool
import requests
import tempfile, os
import time

"""Voice cloning service (pool-based).

Actual order de resolución:
1. voice_clone_id persistente del usuario (provider)
2. pooled_voice_id (LRU) reutilizado
3. muestra binaria del usuario (sample crudo) como último recurso coherente con texto
4. None -> el caller hará fallback a TTS genérico

Se elimina el placeholder estático global para evitar inconsistencias y ahorrar maintenance.
"""

_USER_VOICE_CACHE: Dict[str, Tuple[str, bytes, float]] = {}
_CACHE_TTL_SECONDS = 300


def _get_db():
    if not settings.mongo_uri:
        return None, None
    client = MongoClient(settings.mongo_uri)
    return client["voicememos_db"], client


def _is_mp3(data: bytes) -> bool:
    if not data or len(data) < 4:
        return False
    if data.startswith(b"ID3"):
        return True
    # Frame sync 11 bits: 0xFFE mask on first two bytes
    b0, b1 = data[0], data[1]
    return b0 == 0xFF and (b1 & 0xE0) == 0xE0


def fetch_user_voice_sample(user_id: str) -> Optional[bytes]:
    now = time.time()
    cached = _USER_VOICE_CACHE.get(user_id)
    if cached and (now - cached[2]) < _CACHE_TTL_SECONDS:
        return cached[1]

    db, client = _get_db()
    if db is None:
        return None
    try:
        from bson import ObjectId  # type: ignore
        try:
            oid = ObjectId(user_id)
        except Exception:
            return None
        user = db["users"].find_one(
            {"_id": oid},
            {"recordedVoiceBinary": 1, "recordedVoiceHash": 1, "recordedVoiceMime": 1, "recordedVoiceTranscoded": 1}
        )
        if not user:
            return None
        blob = user.get("recordedVoiceBinary")
        if not blob:
            return None
        if isinstance(blob, str):
            try:
                blob = base64.b64decode(blob)
            except Exception:
                return None
        # Post-condition: upload endpoint guarantees MP3; keep defensive check
        if not _is_mp3(blob):
            return None
        voice_hash = user.get("recordedVoiceHash") or "unknown"
        _USER_VOICE_CACHE[user_id] = (voice_hash, blob, now)
        return blob
    finally:
        if client:
            client.close()


def get_user_voice_id(user_id: str) -> Optional[str]:
    db, client = _get_db()
    if db is None:
        return None
    try:
        from bson import ObjectId  # type: ignore
        try:
            oid = ObjectId(user_id)
        except Exception:
            return None
        doc = db["users"].find_one({"_id": oid}, {"voice_clone_id": 1})
        if not doc:
            return None
        vcid = doc.get("voice_clone_id")
        if vcid and isinstance(vcid, str) and len(vcid) >= 10:
            return vcid
        return None
    finally:
        if client:
            client.close()


def synthesize_with_user_voice(text: str, user_id: str, db=None, user_sample: Optional[bytes] = None) -> Optional[bytes]:
    """Attempt to synthesize using the user's cloned voice via ElevenLabs.

    Order:
    1. If user has provider voice_clone_id: call ElevenLabs TTS with that ID.
    2. Else if user uploaded a recorded sample: return that raw sample (placeholder behavior, not true re-voicing).
    3. Else fallback to static placeholder.
    4. Return None to signal generic TTS if all above fail.
    """
    api_key = settings.elevenlabs_api_key
    voice_id = get_user_voice_id(user_id)
    if voice_id and voice_id.startswith("stub_"):
        if db is not None and settings.elevenlabs_pool_enabled:
            try:
                pool = get_voice_pool(db)
                pool.ensure_voice(voice_id, user_id)
            except Exception as e:
                print({"event": "voice_pool_error", "stage": "ensure_stub", "error": str(e)})
        return b"ID3STUBAUDIO_PAYLOAD"
    if voice_id and api_key:
        # Asegurar entrada en pool (LRU) si está habilitado
        if db is not None and settings.elevenlabs_pool_enabled:
            try:
                pool = get_voice_pool(db)
                pool.ensure_voice(voice_id, user_id)
            except Exception as e:
                print({"event": "voice_pool_error", "stage": "ensure_voice", "error": str(e)})
        try:
            from elevenlabs.client import ElevenLabs  # type: ignore
            from elevenlabs import VoiceSettings  # type: ignore
            client = ElevenLabs(api_key=api_key)
            # Dynamic settings from user profile (0-100 ints mapped to 0-1 floats)
            stability = 0.5
            similarity = 0.75
            style = 0.3
            speed = None
            if db is not None:
                try:
                    from bson import ObjectId  # type: ignore
                    oid = ObjectId(user_id)
                    u = db["users"].find_one({"_id": oid}, {"settings": 1}) or {}
                    s = (u.get("settings") or {})
                    def pct_to_float(val, default):
                        try:
                            if val is None:
                                return default
                            f = float(val)
                            if f > 1.0:
                                f = max(0.0, min(100.0, f)) / 100.0
                            else:
                                f = max(0.0, min(1.0, f))
                            return f
                        except Exception:
                            return default
                    stability = pct_to_float(s.get("voice_stability"), stability)
                    similarity = pct_to_float(s.get("voice_similarity"), similarity)
                    # Optionally map background_volume to style accentuation (light heuristic)
                    if "background_volume" in s:
                        style = pct_to_float(s.get("background_volume"), style) * 0.4  # keep style moderate
                    # Future: speed mapping (if user setting available)
                except Exception as e:
                    print({"event": "voice_clone_settings_error", "error": str(e)})
            vs = VoiceSettings(stability=stability, similarity_boost=similarity, style=style, use_speaker_boost=True, speed=speed)
            print({"event": "voice_clone_settings", "user_id": user_id, "voice_id": voice_id, "stability": stability, "similarity": similarity, "style": style, "speed": speed})
            model_id = settings.elevenlabs_model
            print({"event": "voice_clone_model_selected", "user_id": user_id, "voice_id": voice_id, "model_id": model_id})
            audio = client.text_to_speech.convert(
                voice_id=voice_id,
                optimize_streaming_latency=0,
                output_format="mp3_44100_128",
                text=text,
                model_id=model_id,
                voice_settings=vs,
            )
            if isinstance(audio, (bytes, bytearray)):
                audio_bytes = bytes(audio)
            else:
                try:
                    audio_bytes = b"".join(chunk for chunk in audio)  # type: ignore
                except Exception:
                    audio_bytes = b""
            if audio_bytes:
                print({"event": "voice_clone", "source": "provider_voice_id", "user_id": user_id, "voice_id": voice_id, "bytes": len(audio_bytes)})
                return audio_bytes
        except Exception as e:
            print({"event": "voice_clone_error", "stage": "provider_tts", "user_id": user_id, "voice_id": voice_id, "error": str(e)})
    # Modo stub: si existe voice_clone_id sintético devolver bytes mínimos
    stub_id = get_user_voice_id(user_id)
    if stub_id and (not api_key) and stub_id.startswith("stub_"):
        return b"ID3STUBMINIMAL"
    print({"event": "voice_clone", "source": "no_clone_failure", "user_id": user_id})
    return None


def create_persistent_voice_clone(user_id: str, sample_bytes: bytes, db=None) -> Optional[str]:
    """Crea clon persistente (una sola vez) y lo inserta en pool inmediatamente.
    Si no hay API key usa modo stub y genera un ID sintético para pruebas locales.
    """
    if not sample_bytes:
        return None
    # Stub path primero para evitar cualquier intento de crear clon real sin API key
    if not settings.elevenlabs_api_key:
        existing_stub = get_user_voice_id(user_id)
        if existing_stub and existing_stub.startswith("stub_"):
            # Ensure provider metadata exists
            if db is not None:
                try:
                    from bson import ObjectId  # type: ignore
                    oid = ObjectId(user_id)
                    db["users"].update_one({"_id": oid}, {"$set": {"voice_clone_provider": "stub"}})
                except Exception:
                    pass
            return existing_stub
        synthetic_id = f"stub_{user_id[:6]}"
        if db is not None:
            try:
                from bson import ObjectId  # type: ignore
                oid = ObjectId(user_id)
                db["users"].update_one({"_id": oid}, {"$set": {"voice_clone_id": synthetic_id, "voice_clone_provider": "stub"}})
                if settings.elevenlabs_pool_enabled:
                    pool = get_voice_pool(db)
                    pool.ensure_voice(synthetic_id, user_id)
            except Exception as e:
                print({"event": "voice_clone_stub_error", "error": str(e)})
        print({"event": "voice_clone", "stage": "stub_created", "voice_id": synthetic_id})
        return synthetic_id
    # Si ya existe en user, no recrear
    existing = get_user_voice_id(user_id)
    if existing:
        if db is not None and settings.elevenlabs_pool_enabled:
            try:
                pool = get_voice_pool(db)
                pool.ensure_voice(existing, user_id)
            except Exception as e:
                print({"event": "voice_pool_error", "stage": "ensure_existing", "error": str(e)})
        return existing
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            tmp.write(sample_bytes)
            path = tmp.name
        headers = {"xi-api-key": settings.elevenlabs_api_key}
        files = [("files", (f"user_{user_id[:6]}.mp3", open(path, "rb"), "audio/mpeg"))]
        data = {"name": f"user_{user_id[:6]}", "description": "user persistent voice", "labels": "{}"}
        resp = requests.post("https://api.elevenlabs.io/v1/voices/add", headers=headers, files=files, data=data, timeout=90)
        fallback_stub_allowed = settings.env and settings.env.lower() != 'production'
        try:
            resp.raise_for_status()
        except Exception:
            print({"event": "voice_clone_error", "stage": "create", "status": resp.status_code, "body": resp.text[:200]})
            if fallback_stub_allowed:
                voice_id = f"stub_{user_id[:6]}"
            else:
                return None
        else:
            voice_id = resp.json().get("voice_id")
            if not voice_id:
                print({"event": "voice_clone_error", "stage": "parse", "body": resp.text[:200]})
                if fallback_stub_allowed:
                    voice_id = f"stub_{user_id[:6]}"
                else:
                    return None
        # Persistir en user
        if db is not None:
            try:
                from bson import ObjectId  # type: ignore
                oid = ObjectId(user_id)
                db["users"].update_one({"_id": oid}, {"$set": {"voice_clone_id": voice_id, "voice_clone_provider": ("elevenlabs" if not voice_id.startswith("stub_") else "stub")}})
            except Exception as e:
                print({"event": "voice_clone_error", "stage": "persist_user", "error": str(e)})
        # Insertar en pool como MRU
        if db is not None and settings.elevenlabs_pool_enabled:
            try:
                pool = get_voice_pool(db)
                pool.ensure_voice(voice_id, user_id)
            except Exception as e:
                print({"event": "voice_pool_error", "stage": "ensure_new", "error": str(e)})
        print({"event": "voice_clone", "stage": "created", "voice_id": voice_id})
        return voice_id
    finally:
        try:
            if 'path' in locals() and os.path.exists(path):
                os.remove(path)
        except Exception:
            pass


def promote_stub_to_real_clone(user_id: str, sample_bytes: bytes, db=None) -> Optional[str]:
    """Si el usuario tiene un stub_ y ahora existe API key, crear clon real y reemplazar.
    Devuelve nuevo voice_id real o None si falla (mantiene stub en ese caso).
    """
    if not sample_bytes or not settings.elevenlabs_api_key:
        return None
    existing = get_user_voice_id(user_id)
    if not existing or not existing.startswith("stub_"):
        return None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            tmp.write(sample_bytes)
            path = tmp.name
        headers = {"xi-api-key": settings.elevenlabs_api_key}
        files = [("files", (f"user_{user_id[:6]}.mp3", open(path, "rb"), "audio/mpeg"))]
        data = {"name": f"user_{user_id[:6]}", "description": "user persistent voice", "labels": "{}"}
        resp = requests.post("https://api.elevenlabs.io/v1/voices/add", headers=headers, files=files, data=data, timeout=90)
        try:
            resp.raise_for_status()
        except Exception:
            print({"event": "voice_clone_error", "stage": "promote_create", "status": resp.status_code, "body": resp.text[:200]})
            return None
        new_voice_id = resp.json().get("voice_id")
        if not new_voice_id:
            print({"event": "voice_clone_error", "stage": "promote_parse", "body": resp.text[:200]})
            return None
        if db is not None:
            try:
                from bson import ObjectId
                oid = ObjectId(user_id)
                db["users"].update_one({"_id": oid}, {"$set": {"voice_clone_id": new_voice_id, "voice_clone_provider": "elevenlabs", "updated_at": datetime.utcnow()}})
            except Exception as e:
                print({"event": "voice_clone_error", "stage": "promote_persist", "error": str(e)})
        if db is not None and settings.elevenlabs_pool_enabled:
            try:
                pool = get_voice_pool(db)
                pool.ensure_voice(new_voice_id, user_id)
            except Exception as e:
                print({"event": "voice_pool_error", "stage": "promote_pool", "error": str(e)})
        print({"event": "voice_clone", "stage": "promoted_stub", "old": existing, "new": new_voice_id})
        return new_voice_id
    finally:
        try:
            if 'path' in locals() and os.path.exists(path):
                os.remove(path)
        except Exception:
            pass


def update_existing_real_clone(user_id: str, sample_bytes: bytes, db=None) -> bool:
    """Actualiza (re-entrena) un clon real existente subiendo nueva muestra.
    ElevenLabs no soporta edición directa simple en todas las modalidades; mientras tanto se podría:
    - Crear nueva voz y opcionalmente borrar la anterior (estrategia simple v1)
    Aquí implementamos estrategia v1: crear nueva y sustituir.
    """
    if not sample_bytes or not settings.elevenlabs_api_key:
        return False
    current = get_user_voice_id(user_id)
    if not current or current.startswith("stub_"):
        return False
    # Crear nueva y reemplazar (mantener antigua sin borrar remoto todavía)
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            tmp.write(sample_bytes)
            path = tmp.name
        headers = {"xi-api-key": settings.elevenlabs_api_key}
        files = [("files", (f"user_{user_id[:6]}_upd.mp3", open(path, "rb"), "audio/mpeg"))]
        data = {"name": f"user_{user_id[:6]}_v2", "description": "user updated voice", "labels": "{}"}
        resp = requests.post("https://api.elevenlabs.io/v1/voices/add", headers=headers, files=files, data=data, timeout=90)
        try:
            resp.raise_for_status()
        except Exception:
            print({"event": "voice_clone_error", "stage": "update_create", "status": resp.status_code, "body": resp.text[:200]})
            return False
        new_voice_id = resp.json().get("voice_id")
        if not new_voice_id:
            print({"event": "voice_clone_error", "stage": "update_parse", "body": resp.text[:200]})
            return False
        if db is not None:
            try:
                from bson import ObjectId
                oid = ObjectId(user_id)
                db["users"].update_one({"_id": oid}, {"$set": {"voice_clone_id": new_voice_id, "voice_clone_previous_id": current, "voice_clone_provider": "elevenlabs", "updated_at": datetime.utcnow()}})
            except Exception as e:
                print({"event": "voice_clone_error", "stage": "update_persist", "error": str(e)})
        if db is not None and settings.elevenlabs_pool_enabled:
            try:
                pool = get_voice_pool(db)
                pool.ensure_voice(new_voice_id, user_id)
            except Exception as e:
                print({"event": "voice_pool_error", "stage": "update_pool", "error": str(e)})
        print({"event": "voice_clone", "stage": "updated_clone", "old": current, "new": new_voice_id})
        return True
    finally:
        try:
            if 'path' in locals() and os.path.exists(path):
                os.remove(path)
        except Exception:
            pass


def ensure_voice_clone_job(user_id: str, audio_bytes: bytes) -> str:
    """Submit or reuse a clone job. For now returns a fake job id.

    Future responsibilities:
    - Validate min duration (>=30s) and max duration limits
    - Upload chunks to provider
    - Store pending job metadata (status=pending, created_at, duration_s)
    - Return job identifier for polling
    """
    return f"job_{user_id}_placeholder"


def poll_voice_clone_job(job_id: str) -> dict:
    """Poll provider for job status. Placeholder always returns completed."""
    return {"job_id": job_id, "status": "completed", "voice_id": "voice_placeholder"}


def get_or_create_user_voice(user_id: str) -> Optional[str]:
    """Return a stable voice_id for user if already cloned. Placeholder returns None."""
    return None
