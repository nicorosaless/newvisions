from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse

from .config import settings
from .api import api_router

try:
    app = FastAPI(title=settings.app_name)
    
    print(f"Starting {settings.app_name} in {settings.env} environment")
    print(f"Port: {settings.port}")
    print(f"MongoDB URI configured: {bool(settings.mongo_uri)}")
    print(f"ElevenLabs API key configured: {bool(settings.elevenlabs_api_key)}")
    print(f"Google API key configured: {bool(settings.google_api_key)}")
    print(f"Available routes: {[route.path for route in app.routes if hasattr(route, 'path')]}")
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Adjust for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/")
    async def root():
        """Root endpoint - return API info"""
        return {
            "message": "NewVisions API",
            "version": "1.0.0",
            "health": "/health",
            "docs": "/docs",
            "status": "running"
        }

    @app.get("/docs")
    async def docs():
        """API documentation"""
        return RedirectResponse(url="/docs", status_code=302)

    app.include_router(api_router)

    # Serve static audio assets (fan.mp3 etc.) - only if directory exists
    import os
    if os.path.exists("backend/audio-files"):
        app.mount("/audio-static", StaticFiles(directory="backend/audio-files"), name="audio-static")
    else:
        print("Warning: backend/audio-files directory not found, skipping static file mount")

    print("✅ App initialization completed successfully")

except Exception as e:
    print(f"❌ Error during app initialization: {e}")
    import traceback
    traceback.print_exc()
    raise


def get_app():  # For uvicorn --factory
    return app

# Also expose app directly for Railway
app_instance = get_app()

