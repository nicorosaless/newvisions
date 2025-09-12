from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from .config import settings
from .models import (
    ThoughtRequest,
    ThoughtResponse,
    AudioRequest,
    AudioResponse,
)
from .services.thought_service import generate_thought
from .services.audio_service import synthesize_and_save, elevenlabs_status

api_router = APIRouter()

TMP_DIR = Path("backend/tmp")


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
