from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
import os

from .config import settings
from .api import api_router


app = FastAPI(title=settings.app_name)

print(f"Starting {settings.app_name} in {settings.env} environment")
print(f"Port: {settings.port}")
print(f"MongoDB URI configured: {bool(settings.mongo_uri)}")
print(f"ElevenLabs API key configured: {bool(settings.elevenlabs_api_key)}")
print(f"Google API key configured: {bool(settings.google_api_key)}")

app.add_middleware(
    CORSMiddleware,
        allow_origins=["*"],  # Adjust for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# API routes (these will take precedence over static files)
app.include_router(api_router, prefix="/api")

# Mount frontend static files (lower priority)
frontend_dist_path = os.path.join(os.path.dirname(__file__), "../frontend/dist")
if os.path.exists(frontend_dist_path):
    app.mount("/", StaticFiles(directory=frontend_dist_path, html=True), name="frontend")
    print(f"✅ Frontend static files mounted from: {frontend_dist_path}")
else:
    print(f"⚠️  Frontend dist directory not found: {frontend_dist_path}")

# Serve static audio assets
if os.path.exists("backend/audio-files"):
    app.mount("/audio-static", StaticFiles(directory="backend/audio-files"), name="audio-static")
else:
    print("Warning: backend/audio-files directory not found, skipping static file mount")


def get_app():  # For uvicorn --factory
    return app

# Also expose app directly for Railway
app_instance = get_app()

