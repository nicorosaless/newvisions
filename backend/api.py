from pathlib import Path
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from pymongo import MongoClient
import bcrypt
from datetime import datetime
from fastapi.responses import FileResponse

from .config import settings
from . import model_costs as _mc
from .models import (
    ThoughtRequest,
    ThoughtResponse,
    AudioRequest,
    AudioResponse,
    UserSettings,
    SettingsUpdateRequest,
    PerformRequest,
    PerformResponse,
)
from .services.content.thought_service import generate_thought
from .services.content.thought_service import build_routine_prompt, generate_from_prompt, build_voice_note_prompt
from .services.audio.audio_service import synthesize_and_save, elevenlabs_status, mix_with_fan
from .services.voice_cloning.voice_clone_service import (
    synthesize_with_user_voice,
    fetch_user_voice_sample,
    get_user_voice_id,
    create_persistent_voice_clone,
    promote_stub_to_real_clone,
    update_existing_real_clone,
)
# Pool logic removed: starting fresh for perform flow

api_router = APIRouter()

TMP_DIR = Path("backend/tmp")
AMBIENT_DIR = Path("backend/audio-files")

# Ensure directories exist
TMP_DIR.mkdir(exist_ok=True)
AMBIENT_DIR.mkdir(exist_ok=True)


# --- Mongo helper (quick inline for now; later move to services/config) ---
def get_db():
    if not settings.mongo_uri:
        raise HTTPException(
            status_code=500,
            detail="Database not configured. Please set MONGO_URI environment variable."
        )
    try:
        # Log the URI for debugging (mask password)
        import re
        masked_uri = re.sub(r'://([^:]+):([^@]+)@', r'://\1:***@\2', settings.mongo_uri)
        print(f"Connecting to MongoDB: {masked_uri}")
        client = MongoClient(settings.mongo_uri, serverSelectionTimeoutMS=5000, tlsAllowInvalidCertificates=True)
        # Test the connection
        client.admin.command('ping')
        print("Successfully connected to MongoDB")
        # Use documented db name
        return client["voicememos_db"], client
    except Exception as e:
        print(f"Database connection failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Database connection failed: {str(e)}"
        )


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    activationCode: str = Field(min_length=11, max_length=11, pattern=r"^[A-Za-z0-9]{11}$")


class RegisterResponse(BaseModel):
    user_id: str
    username: str
    email: EmailStr


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    user_id: str
    username: str
    email: EmailStr


def hash_password(raw: str) -> bytes:
    return bcrypt.hashpw(raw.encode("utf-8"), bcrypt.gensalt())


def verify_password(raw: str, hashed: bytes) -> bool:
    try:
        return bcrypt.checkpw(raw.encode("utf-8"), hashed)
    except ValueError:
        return False


@api_router.get("/health")
def health():
    model_id = settings.elevenlabs_model
    try:
        cost_factor = _mc.get_elevenlabs_model_cost_factor(model_id)
    except Exception:
        cost_factor = None
    return {
        "status": "ok",
        "app": settings.app_name,
        "env": settings.env,
        "port": settings.port,
        "has_google_api_key": bool(settings.google_api_key),
        "has_elevenlabs_api_key": bool(settings.elevenlabs_api_key),
        "elevenlabs_model": model_id,
        "model_cost_factor": cost_factor,
    }


@api_router.post("/generate-thought", response_model=ThoughtResponse)
def post_generate_thought(payload: ThoughtRequest):
    text = generate_thought(payload.topic, payload.value)
    return ThoughtResponse(thought=text)


@api_router.post("/generate-audio", response_model=AudioResponse)
def post_generate_audio(payload: AudioRequest):
    text = generate_thought(payload.topic, payload.value)
    try:
        audio_b64, path = synthesize_and_save(text, TMP_DIR)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return AudioResponse(audio_base64=audio_b64, text=text, filename=path.name)


@api_router.get("/audio/{filename}")
def get_audio_file(filename: str):
    path = TMP_DIR / filename
    if not path.exists() or not path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path, media_type="audio/mpeg", filename=filename)

@api_router.get("/ambient/fan")
def get_ambient_fan():
    fan_path = AMBIENT_DIR / "fan.mp3"
    if not fan_path.exists() or not fan_path.is_file():
        raise HTTPException(status_code=404, detail="fan.mp3 not found")
    return FileResponse(fan_path, media_type="audio/mpeg", filename="fan.mp3")


@api_router.get("/providers/elevenlabs/status")
def provider_elevenlabs_status():
    return elevenlabs_status()


# --------------------------- Auth Endpoints (MVP) ---------------------------
@api_router.post("/auth/register", response_model=RegisterResponse)
def register_user(payload: RegisterRequest):
    db, client = get_db()
    try:
        users = db["users"]
        activation_codes = db["activation_codes"]

        # Check activation code validity (must exist and unused or not restricted yet)
        code_doc = activation_codes.find_one({"code": payload.activationCode})
        if not code_doc:
            raise HTTPException(status_code=400, detail="Invalid activation code")
        if code_doc.get("used"):
            raise HTTPException(status_code=400, detail="Activation code already used")

        if users.find_one({"username": payload.username}):
            raise HTTPException(status_code=400, detail="Username already exists")
        if users.find_one({"email": payload.email}):
            raise HTTPException(status_code=400, detail="Email already exists")

        user_doc = {
            "username": payload.username,
            "email": payload.email,
            "password": hash_password(payload.password),  # bytes
            "created_at": datetime.utcnow(),
            "voice_clone_id": None,
            "charCount": 0,
            "recordedVoice": None,
            # Initialize settings with defaults so frontend sees consistent schema
            "settings": UserSettings().model_dump(),
        }
        result = users.insert_one(user_doc)

        activation_codes.update_one(
            {"_id": code_doc["_id"]},
            {"$set": {"used": True, "used_at": datetime.utcnow(), "used_by": result.inserted_id}}
        )

        return RegisterResponse(user_id=str(result.inserted_id), username=user_doc["username"], email=user_doc["email"])
    finally:
        client.close()


@api_router.post("/auth/login", response_model=LoginResponse)
def login_user(payload: LoginRequest):
    db, client = get_db()
    try:
        users = db["users"]
        user = users.find_one({"username": payload.username})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        stored_pw = user.get("password")
        if not isinstance(stored_pw, (bytes, bytearray)):
            raise HTTPException(status_code=500, detail="Corrupt password storage")
        if not verify_password(payload.password, stored_pw):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        return LoginResponse(user_id=str(user["_id"]), username=user["username"], email=user["email"])
    finally:
        client.close()


@api_router.put("/users/{user_id}/settings", response_model=UserSettings)
def update_user_settings(user_id: str, payload: SettingsUpdateRequest):
    db, client = get_db()
    try:
        users = db["users"]
        from bson import ObjectId
        try:
            oid = ObjectId(user_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid user_id")

        user = users.find_one({"_id": oid})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Store as simple dict
        settings_dict = payload.model_dump()
        users.update_one({"_id": oid}, {"$set": {"settings": settings_dict, "updated_at": datetime.utcnow()}})
        return UserSettings(**settings_dict)
    finally:
        client.close()


@api_router.get("/users/{user_id}/settings", response_model=UserSettings)
def get_user_settings(user_id: str):
    db, client = get_db()
    try:
        users = db["users"]
        from bson import ObjectId
        try:
            oid = ObjectId(user_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid user_id")

        user = users.find_one({"_id": oid})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        settings_doc = user.get("settings") or {}

        # Legacy mapping (idempotent): if old float style present convert to 0-100 ints
        mapped = {}
        # Accept both new and old keys; new keys take precedence if both exist
        mapped['voice_language'] = settings_doc.get('voice_language') or settings_doc.get('language') or 'en'
        mapped['speaker_sex'] = settings_doc.get('speaker_sex') or settings_doc.get('sex') or 'male'

        def to_int_percent(value, default):
            if value is None:
                return default
            try:
                # If value already 0-100 keep; if 0-1 scale
                v = float(value)
                if 0 <= v <= 1:
                    return int(round(v * 100))
                if 0 <= v <= 100:
                    return int(round(v))
            except (TypeError, ValueError):
                pass
            return default

        mapped['voice_stability'] = to_int_percent(settings_doc.get('voice_stability') or settings_doc.get('stability'), 50)
        mapped['voice_similarity'] = to_int_percent(settings_doc.get('voice_similarity'), 75)
        # background sound boolean
        mapped['background_sound'] = settings_doc.get('background_sound') if 'background_sound' in settings_doc else settings_doc.get('add_background_sound', False)
        mapped['background_volume'] = to_int_percent(settings_doc.get('background_volume'), 30)
        mapped['voice_note_name'] = settings_doc.get('voice_note_name')
        mapped['voice_note_date'] = settings_doc.get('voice_note_date')
        mapped['voice_note_name_default'] = bool(settings_doc.get('voice_note_name_default', False))
        normalized = UserSettings(**mapped)

        # Write-back if original was missing keys or legacy structure
        if settings_doc != normalized.model_dump():
            users.update_one({"_id": oid}, {"$set": {"settings": normalized.model_dump(), "updated_at": datetime.utcnow()}})

        return normalized
    finally:
        client.close()


@api_router.get("/users/{user_id}/meta")
def get_user_meta(user_id: str):
    db, client = get_db()
    try:
        users = db["users"]
        from bson import ObjectId
        try:
            oid = ObjectId(user_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid user_id")
        user = users.find_one({"_id": oid}, {"charCount": 1})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        # Hardcode provisional monthly limit until limits service implemented
        limit = 4000
        return {"charCount": int(user.get("charCount") or 0), "monthlyLimit": limit}
    finally:
        client.close()


# --------------------------- Voice Upload (recordedVoice) ---------------------------
class VoiceUploadRequest(BaseModel):
    audio_base64: str = Field(min_length=20, description="Base64 encoded audio (webm/mp4/wav)")
    mime_type: Optional[str] = Field(default=None, description="Client-reported MIME type")
    duration_seconds: Optional[float] = Field(default=None, description="Client measured duration in seconds")
    desired_voice_name: Optional[str] = Field(default=None, description="Preferred persistent voice_clone_id (e.g., username_voice)")


@api_router.post("/users/{user_id}/voice")
def upload_user_voice(user_id: str, payload: VoiceUploadRequest):
    db, client = get_db()
    try:
        from bson import ObjectId
        try:
            oid = ObjectId(user_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid user_id")
        users = db["users"]
        user = users.find_one({"_id": oid}, {"_id": 1})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        b64_str = payload.audio_base64.strip()
        # Basic validation: remove possible data URL prefix
        if b64_str.startswith("data:"):
            try:
                b64_str = b64_str.split(",", 1)[1]
            except Exception:
                raise HTTPException(status_code=400, detail="Malformed data URL")
        import base64
        try:
            raw = base64.b64decode(b64_str, validate=True)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 audio")
        # Size guard ~3MB
        if len(raw) > 3 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Audio too large (max 3MB)")
        if len(raw) < 4000:
            raise HTTPException(status_code=400, detail="Audio too short (corrupted)")

        # Enforce duration between 30 and 60 seconds inclusive
        dur = payload.duration_seconds
        if dur is not None:
            if dur < 30:
                raise HTTPException(status_code=400, detail="Recording must be at least 30 seconds")
            if dur > 60:
                raise HTTPException(status_code=400, detail="Recording must not exceed 60 seconds")
        else:
            # Heuristic if duration not provided: allow if raw size within plausible 20-60s compressed range
            # Assume 12KB/s - 40KB/s typical opus. 30s => ~360KB lower bound, 60s => ~2400KB upper bound
            if len(raw) < 340 * 1024:
                raise HTTPException(status_code=400, detail="Recording likely under 30 seconds; please record longer")
            if len(raw) > 3 * 1024 * 1024:  # already checked above but keep logical consistency
                raise HTTPException(status_code=400, detail="Recording likely over allowed length")

        import hashlib
        # If not already MP3 attempt to transcode to MP3 so perform() can reuse directly
        def _is_mp3(data: bytes) -> bool:
            if not data or len(data) < 4:
                return False
            if data.startswith(b"ID3"):
                return True
            b0, b1 = data[0], data[1]
            return b0 == 0xFF and (b1 & 0xE0) == 0xE0

        original_mime = payload.mime_type or "application/octet-stream"
        source_format = original_mime
        mp3_bytes = raw
        transcoded = False
        if not _is_mp3(raw):
            # Try ffmpeg cli (must be installed in system PATH)
            import tempfile, subprocess, os
            from pathlib import Path as _Path
            try:
                with tempfile.TemporaryDirectory() as td:
                    inp = _Path(td) / "input.bin"
                    outp = _Path(td) / "output.mp3"
                    inp.write_bytes(raw)
                    # Resolve ffmpeg path (system or imageio fallback)
                    ffmpeg_bin = "ffmpeg"
                    try:
                        import shutil
                        if shutil.which("ffmpeg") is None:
                            try:
                                import imageio_ffmpeg
                                ffmpeg_bin = imageio_ffmpeg.get_ffmpeg_exe()
                            except Exception:
                                raise HTTPException(status_code=400, detail="ffmpeg not available; install it or upload MP3 directly")
                    except Exception:
                        pass
                    # Basic ffmpeg command: re-encode to mono 44.1kHz ~96k bitrate
                    cmd = [
                        ffmpeg_bin, "-hide_banner", "-loglevel", "error",
                        "-y", "-i", str(inp),
                        "-vn", "-ar", "44100", "-ac", "1", "-b:a", "96k",
                        str(outp)
                    ]
                    try:
                        subprocess.run(cmd, check=True, timeout=30)
                        if outp.is_file():
                            mp3_bytes = outp.read_bytes()
                            if _is_mp3(mp3_bytes) and len(mp3_bytes) > 1000:
                                transcoded = True
                    except subprocess.CalledProcessError:
                        pass
                    except FileNotFoundError:
                        # ffmpeg missing - we will reject non-mp3 uploads so perform can function uniformly
                        raise HTTPException(status_code=400, detail="ffmpeg not installed on server; upload an MP3 directly")
                    except subprocess.TimeoutExpired:
                        raise HTTPException(status_code=400, detail="Transcoding timeout; try shorter / simpler recording")
            except HTTPException:
                raise
            except Exception:
                # Silent fallback: keep original (will not be reused in perform) but better to force mp3 requirement
                raise HTTPException(status_code=400, detail="Failed to transcode audio; please upload MP3")

        # After potential transcode, enforce size again (mp3 might be larger)
        if len(mp3_bytes) > 3 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Transcoded audio too large (>3MB)")

        voice_hash = hashlib.sha256(mp3_bytes).hexdigest()
        # Store binary + metadata; keep legacy key for compatibility if other code expects recordedVoice
        # If same hash as existing, avoid rewriting to save I/O
        existing = users.find_one({"_id": oid}, {"recordedVoiceHash": 1})
        if existing and existing.get("recordedVoiceHash") == voice_hash:
            users.update_one({"_id": oid}, {"$set": {"recordedVoiceDuration": dur, "updated_at": datetime.utcnow()}})
            return {"status": "ok", "bytes": len(mp3_bytes), "hash": voice_hash, "duration": dur, "dedup": True, "transcoded": False}

        users.update_one(
            {"_id": oid},
            {"$set": {
                "recordedVoice": None,
                "recordedVoiceBinary": mp3_bytes,
                "recordedVoiceMime": "audio/mpeg",
                "recordedVoiceSourceFormat": source_format,
                "recordedVoiceHash": voice_hash,
                "recordedVoiceDuration": dur,
                "recordedVoiceTranscoded": transcoded,
                "updated_at": datetime.utcnow()
            }}
        )
        # Assign or keep voice_clone_id without contacting providers
        users_doc = users.find_one({"_id": oid}, {"voice_clone_id": 1, "username": 1, "voice_clone_provider": 1}) or {}
        clone_id = users_doc.get("voice_clone_id")
        if not clone_id:
            # Normalize desired voice name if provided; else derive from username
            def _normalize_name(name: str) -> str:
                import re
                base = re.sub(r"[^a-zA-Z0-9_]+", "_", name.strip())
                base = re.sub(r"_+", "_", base).strip("_")
                return base[:64] if base else "voice"
            desired = payload.desired_voice_name.strip() if payload.desired_voice_name else None
            if desired:
                clone_id = _normalize_name(desired)
            else:
                uname = users_doc.get("username") or "user"
                clone_id = _normalize_name(f"{uname}_voice")
            users.update_one({"_id": oid}, {"$set": {"voice_clone_id": clone_id, "voice_clone_provider": "stub", "voice_clone_updated_at": datetime.utcnow()}})
        else:
            users.update_one({"_id": oid}, {"$set": {"voice_clone_updated_at": datetime.utcnow()}})

        return {"status": "ok", "bytes": len(mp3_bytes), "hash": voice_hash, "duration": dur, "dedup": False, "transcoded": transcoded, "voice_clone_id": clone_id, "action": "saved_only"}
    finally:
        client.close()


# --------------------------- Voice Meta Endpoint ---------------------------
@api_router.get("/users/{user_id}/voice/meta")
def get_user_voice_meta(user_id: str, debug: Optional[int] = 0):
    """Return status of user's voice assets: sample presence, clone id, and pool membership."""
    db, client = get_db()
    try:
        from bson import ObjectId
        try:
            oid = ObjectId(user_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid user_id")
        users = db["users"]
        user = users.find_one({"_id": oid}, {"recordedVoiceBinary": 1, "voice_clone_id": 1, "voice_clone_name": 1, "provider_voice_id": 1})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        has_sample = bool(user.get("recordedVoiceBinary"))
        # Prefer friendly name if present for UI display
        voice_clone_name = user.get("voice_clone_name")
        stored_voice_clone_id = user.get("voice_clone_id")
        provider_voice_id = user.get("provider_voice_id")
        display_clone_id = voice_clone_name or stored_voice_clone_id
        has_clone = bool(display_clone_id)
        # Pre-perform: only invoke when user has both a stored sample and a voice_clone_id
        pre_info = None
        if has_sample and has_clone:
            try:
                from . import preperform as _pre
                # Print to terminal; optionally include in response when debug
                _pre.run(db, user_id=user_id, voice_clone_id=display_clone_id)
                if debug:
                    pre_info = _pre.collect(db, user_id=user_id, voice_clone_id=display_clone_id)
            except Exception as _e:
                print({"event": "preperform_invoke_error", "error": str(_e)})
        else:
            # Skip preperform until prerequisites are satisfied
            print({"event": "preperform_skipped", "reason": "missing_sample_or_clone", "has_sample": has_sample, "has_clone": has_clone})
        # Compute in_pool from REAL provider voices
        in_pool = False
        try:
            from . import preperform as _pre
            voices = _pre.list_elevenlabs_voices_mru()
            if voices:
                for v in voices:
                    labels = v.get("labels") or {}
                    if str(labels.get("user_id")) == str(user_id):
                        in_pool = True
                        break
                    if provider_voice_id and v.get("voice_id") == provider_voice_id:
                        in_pool = True
                        break
                    if display_clone_id and v.get("name") == display_clone_id:
                        in_pool = True
                        break
        except Exception as pool_e:
            print({"event": "meta_inpool_error", "error": str(pool_e)})
        payload = {
            "hasSample": has_sample,
            "hasClone": has_clone,
            "voiceCloneId": display_clone_id,
            "inPool": in_pool,
        }
        if debug and pre_info is not None:
            payload["preperform"] = pre_info
        return payload
    finally:
        client.close()


@api_router.post("/users/{user_id}/voice/materialize")
def materialize_user_voice_enqueue(user_id: str, create_if_missing: Optional[int] = 1):
    """Materialize the enqueue plan at provider: delete LRU if full and touch/create user's MRU.
    create_if_missing=1 will try to create the provider voice using stored sample.
    """
    db, client = get_db()
    try:
        from bson import ObjectId
        try:
            oid = ObjectId(user_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid user_id")
        users = db["users"]
        # Also retrieve sample presence to auto-create when available
        user = users.find_one({"_id": oid}, {"voice_clone_id": 1, "recordedVoiceBinary": 1})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        voice_clone_id = user.get("voice_clone_id")
        sample_present = bool(user.get("recordedVoiceBinary"))
        try:
            from . import preperform as _pre
            # If caller didn't force off creation, auto-create when sample exists
            create_flag = bool(create_if_missing) or sample_present
            result = _pre.materialize_enqueue(db, user_id=user_id, voice_clone_id=voice_clone_id, create_if_missing=create_flag)
            # Print REAL provider slots after materialize to confirm state
            try:
                sub = _pre.get_subscription_info()
                mru = _pre.list_elevenlabs_voices_mru()
                print(f"[materialize] slots: used={sub.get('voice_slots_used')} / limit={sub.get('voice_limit')} tier={sub.get('tier')}")
                if mru:
                    top = mru[0]
                    last = mru[-1]
                    print(f"[materialize] MRU: {top.get('name')} ({top.get('voice_id')}) at {top.get('last_used_at')}")
                    print(f"[materialize] LRU: {last.get('name')} ({last.get('voice_id')}) at {last.get('last_used_at')}")
                    names = [f"{v.get('name')}({v.get('voice_id')})" for v in mru[:10]]
                    print("[materialize] REAL slots:", ", ".join(names) + (" ..." if len(mru) > 10 else ""))
            except Exception as log_e:
                print({"event": "materialize_log_error", "error": str(log_e)})
            return result
        except Exception as _e:
            print({"event": "preperform_materialize_error", "error": str(_e)})
            raise HTTPException(status_code=500, detail="Materialize failed")
    finally:
        client.close()


@api_router.get("/users/{user_id}/voice/source")
def get_user_voice_source(user_id: str):
    """Return the stored MP3 sample (base64) if user has a recorded voice.
    Only allowed after initial clone creation path; still useful to re-listen.
    """
    db, client = get_db()
    try:
        from bson import ObjectId
        try:
            oid = ObjectId(user_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid user_id")
        users = db["users"]
        doc = users.find_one({"_id": oid}, {"recordedVoiceBinary": 1, "recordedVoiceHash": 1, "recordedVoiceDuration": 1, "voice_clone_id": 1})
        if not doc:
            raise HTTPException(status_code=404, detail="User not found")
        blob = doc.get("recordedVoiceBinary")
        if not blob:
            raise HTTPException(status_code=404, detail="No recorded voice sample")
        if isinstance(blob, str):
            import base64 as _b64
            try:
                blob = _b64.b64decode(blob)
            except Exception:
                raise HTTPException(status_code=500, detail="Corrupted stored sample")
        import base64
        b64audio = base64.b64encode(blob).decode('utf-8')
        return {
            "voiceCloneId": doc.get("voice_clone_id"),
            "hash": doc.get("recordedVoiceHash"),
            "duration": doc.get("recordedVoiceDuration"),
            "audio_base64": b64audio,
            "mime": "audio/mpeg"
        }
    finally:
        client.close()


## Endpoint eliminado: /users/{user_id}/voice/pool/touch (limpieza de pool)


# --------------------------- Perform Endpoint (v1) ---------------------------
@api_router.post("/perform", response_model=PerformResponse)
def perform(payload: PerformRequest):
    import time
    start = time.time()
    db, client = get_db()
    try:
        from bson import ObjectId
        try:
            oid = ObjectId(payload.user_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid user_id")
        users = db["users"]
        user = users.find_one({"_id": oid})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Use stored settings or override
        stored_settings = user.get("settings") or {}
        if payload.settings_override:
            settings_obj = payload.settings_override.model_dump()
        else:
            settings_obj = stored_settings

        routine_type = payload.routine_type.lower().strip()
        value = payload.value.strip()
        if not value:
            raise HTTPException(status_code=400, detail="Value must not be empty")
        if len(value) > 500:
            raise HTTPException(status_code=400, detail="Value too long (max 500 chars)")

        # Monthly character limit (provisional) - enforce BEFORE generation estimation
        MONTHLY_LIMIT = 4000
        current_chars = int(user.get("charCount") or 0)
        if current_chars >= MONTHLY_LIMIT:
            raise HTTPException(status_code=429, detail="Monthly character limit reached")

        # New safe/system prompt for voice note
        language = settings_obj.get("voice_language", "en") or "en"
        voice_prompt = build_voice_note_prompt(routine_type=routine_type, topic=routine_type, value=value, user_language=language)
        print({"event": "gemini_prompt_built", "user_id": payload.user_id, "routine_type": routine_type, "language": language, "prompt_preview": voice_prompt[:180]})
        text = generate_from_prompt(voice_prompt, fallback_topic=routine_type)
        print({"event": "gemini_text_generated", "user_id": payload.user_id, "routine_type": routine_type, "chars": len(text)})

        # Factor de coste único para proyección + actualización
        from . import model_costs as _mc_tmp
        model_id = settings.elevenlabs_model
        cost_factor = _mc_tmp.get_elevenlabs_model_cost_factor(model_id)
        raw_chars = len(text)
        projected = current_chars + int(round(raw_chars * cost_factor))
        if projected > MONTHLY_LIMIT:
            raise HTTPException(status_code=429, detail="Generating this content would exceed monthly limit (credits)")

        # Voice generation (requires persistent clone)
        voice_source = None
        provider_id = get_user_voice_id(payload.user_id)
        if not provider_id:
            sample_bytes = fetch_user_voice_sample(payload.user_id)
            if not sample_bytes:
                raise HTTPException(
                    status_code=409,
                    detail={
                        "error": "VOICE_CLONE_REQUIRED",
                        "message": "User must upload a 30-60s voice sample to create persistent clone before performing.",
                        "action": "Upload sample via POST /users/{user_id}/voice then retry /perform.",
                    }
                )
            created_id = create_persistent_voice_clone(payload.user_id, sample_bytes, db=db)
            if not created_id:
                raise HTTPException(status_code=502, detail="Failed to create persistent voice clone")
            provider_id = created_id
        cloned_audio_bytes = synthesize_with_user_voice(text, payload.user_id, db=db)
        if not cloned_audio_bytes:
            raise HTTPException(status_code=502, detail="Voice clone synthesis failed")
        voice_source = "provider_voice_id"
        # Pool provider usage registration removed (clean slate for perform)
        # Optional background mix
        try:
            if settings_obj.get('background_sound'):
                from pathlib import Path as _P
                fan_path = _P('backend/audio-files/fan.mp3')
                vol = int(settings_obj.get('background_volume') or 30)
                if vol > 0:
                    before_len = len(cloned_audio_bytes)
                    mixed = mix_with_fan(cloned_audio_bytes, fan_path, vol)
                    if mixed and len(mixed) != 0 and mixed is not cloned_audio_bytes:
                        cloned_audio_bytes = mixed
                        print({"event":"perform_mix_applied","vol":vol,"fan_exists":fan_path.exists(),"before":before_len,"after":len(mixed)})
                    else:
                        print({"event":"perform_mix_skipped","reason":"no_change","vol":vol,"fan_exists":fan_path.exists()})
                else:
                    print({"event":"perform_mix_skipped","reason":"volume_zero"})
        except Exception as mix_e:
            print({"event":"mix_warning","error":str(mix_e)})
        import base64
        audio_b64 = base64.b64encode(cloned_audio_bytes).decode('utf-8')

        # Update charCount con factor dinámico según modelo ElevenLabs (Flash/Turbo 0.5, resto 1.0)
        # Reutilizar cost_factor y asegurar mínimo 1 si hay texto y factor >0
        effective_chars = int(round(raw_chars * cost_factor))
        if raw_chars > 0 and effective_chars == 0 and cost_factor > 0:
            effective_chars = 1
        before_char_count = current_chars
        users.update_one({"_id": oid}, {"$inc": {"charCount": effective_chars}, "$set": {"last_perform_at": datetime.utcnow()}})
        updated_user = users.find_one({"_id": oid}, {"charCount": 1}) or {}
        new_char_count = int(updated_user.get("charCount") or 0)
        monthly_limit = MONTHLY_LIMIT

        latency_ms = int((time.time() - start) * 1000)
        print({
            "event": "perform_v1",
            "user_id": payload.user_id,
            "routine_type": routine_type,
            "chars_used_raw": raw_chars,
            "chars_used_effective": effective_chars,
            "model_id": model_id,
            "model_cost_factor": cost_factor,
            "charCount_before": before_char_count,
            "charCount_after": new_char_count,
            "latency_ms": latency_ms,
        })

        return PerformResponse(
            routine_type=routine_type,
            text=text,
            audio_base64=audio_b64,
            filename=None,
            charCount=new_char_count,
            monthlyLimit=monthly_limit,
            voiceSource=voice_source,
            charsUsedRaw=raw_chars,
            charsUsedEffective=effective_chars,
        )
    finally:
        client.close()
