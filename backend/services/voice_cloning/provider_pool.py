from datetime import datetime
from typing import Dict

from backend.config import settings


class ProviderPool:
    """Lightweight provider voice pool tracker.

    Current implementation is an in-memory counter used only to avoid
    import errors and provide basic observability. It can be replaced
    with a persistent store if needed.
    """

    def __init__(self) -> None:
        # Enable when a provider is configured; safe default is True
        # because callers already guard usage and this is a no-op.
        self.enabled: bool = True
        self._uses: Dict[str, int] = {}

    def register_use(self, voice_id: str) -> None:
        if not voice_id:
            return
        self._uses[voice_id] = self._uses.get(voice_id, 0) + 1
        # Basic debug print for visibility
        try:
            print({
                "event": "provider_pool_register_use",
                "voice_id": voice_id,
                "count": self._uses[voice_id],
                "ts": datetime.utcnow().isoformat() + "Z",
                "model": settings.elevenlabs_model,
            })
        except Exception:
            # Never block the request path on logging issues
            pass


_INSTANCE: ProviderPool | None = None


def get_provider_voice_pool() -> ProviderPool:
    global _INSTANCE
    if _INSTANCE is None:
        _INSTANCE = ProviderPool()
    return _INSTANCE
