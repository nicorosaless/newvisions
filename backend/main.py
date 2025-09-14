from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .api import api_router


app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

# Serve static audio assets (fan.mp3 etc.)
app.mount("/audio-static", StaticFiles(directory="backend/audio-files"), name="audio-static")


def get_app():  # For uvicorn --factory
    return app

