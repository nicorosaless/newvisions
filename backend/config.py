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
    # Allow legacy env var name without underscore for compatibility
    _raw_model = os.getenv("ELEVEN_LABS_MODEL") or "eleven_turbo_v2_5"
    if _raw_model:
        _raw_model = _raw_model.strip()
    if not _raw_model:
        _raw_model = "eleven_turbo_v2_5"
    elevenlabs_model: str = _raw_model
    # Pool de voces persistentes (limitado por tier ElevenLabs)
    elevenlabs_pool_enabled: bool = True
    elevenlabs_pool_capacity: int = 10  # valor por defecto; puede variar según tier
    elevenlabs_pool_ttl_minutes: int = 30  # tiempo de inactividad para considerar elegible limpieza
    elevenlabs_pool_eviction_strategy: str = "lru"  # reservado para futuras estrategias (lfu, ttl)
    google_api_key: Optional[str] = os.getenv("GOOGLE_API_KEY")

    # Data
    mongo_uri: Optional[str] = os.getenv("MONGO_URI")

    # Files
    backend_dir: Path = Path(__file__).resolve().parent
    voice_sample_path: Path = Path(os.getenv("VOICE_SAMPLE_PATH", backend_dir / "cloningvoice.mp3"))
    cached_voice_id_path: Path = Path(os.getenv("VOICE_ID_CACHE_PATH", backend_dir / ".voice_id"))


settings = Settings()
