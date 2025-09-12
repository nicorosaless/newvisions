import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv


# Load .env from project root if present
PROJECT_ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = PROJECT_ROOT / ".env"
if ENV_PATH.exists():
    load_dotenv(ENV_PATH.as_posix())


class Settings:
    # Core
    app_name: str = os.getenv("APP_NAME", "newvisions-backend")
    env: str = os.getenv("ENV", "development")
    port: int = int(os.getenv("PORT", "5002"))

    # AI Providers
    elevenlabs_api_key: Optional[str] = os.getenv("ELEVEN_LABS_API_KEY")
    elevenlabs_voice_id: Optional[str] = os.getenv("ELEVEN_LABS_VOICE_ID")
    google_api_key: Optional[str] = os.getenv("GOOGLE_API_KEY")

    # Data
    mongo_uri: Optional[str] = os.getenv("MONGO_URI")

    # Files
    backend_dir: Path = Path(__file__).resolve().parent
    voice_sample_path: Path = Path(os.getenv("VOICE_SAMPLE_PATH", backend_dir / "cloningvoice.mp3"))
    cached_voice_id_path: Path = Path(os.getenv("VOICE_ID_CACHE_PATH", backend_dir / ".voice_id"))


settings = Settings()
