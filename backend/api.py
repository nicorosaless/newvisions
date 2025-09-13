from pathlib import Path
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from pymongo import MongoClient
import bcrypt
from datetime import datetime
from fastapi.responses import FileResponse

from .config import settings
from .models import (
    ThoughtRequest,
    ThoughtResponse,
    AudioRequest,
    AudioResponse,
)
from .services.content.thought_service import generate_thought
from .services.audio.audio_service import synthesize_and_save, elevenlabs_status

api_router = APIRouter()

TMP_DIR = Path("backend/tmp")


# --- Mongo helper (quick inline for now; later move to services/config) ---
def get_db():
    if not settings.mongo_uri:
        raise RuntimeError("MONGO_URI not configured")
    client = MongoClient(settings.mongo_uri)
    # Use documented db name
    return client["voicememos_db"], client


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
    return {
        "status": "ok",
        "app": settings.app_name,
        "env": settings.env,
        "port": settings.port,
        "has_google_api_key": bool(settings.google_api_key),
        "has_elevenlabs_api_key": bool(settings.elevenlabs_api_key),
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
            "settings": None,
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
