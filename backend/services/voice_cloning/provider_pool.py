from __future__ import annotations

"""Provider-backed Voice Pool (in-memory LRU scaffold).

This module replaces the legacy Mongo `voice_pool` collection. Provider voices
are the single source of truth. We keep only ephemeral metadata in-process.

Feature is guarded by settings.PROVIDER_POOL_ENABLED (to be added in config).

Responsibilities (scaffold phase):
 - Track VoiceEntry objects (voice_id, last_used_at, orphaned, deletion_pending)
 - ensure_capacity_then_create(): evict if at capacity before creating new voice
 - register_use(voice_id): update recency on perform
 - reconcile(): (stub) would list provider voices + repair state

Out of scope for initial scaffold:
 - Actual ElevenLabs list/delete/rename integration (TODO markers)
 - Multi-process coordination
 - Metrics emission (TODO markers)
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, Optional, List
import threading

try:  # local import without circular
    from backend.config import settings
except Exception:
    class _FallbackSettings:  # pragma: no cover
        provider_pool_enabled = False
        provider_pool_capacity = 10
    settings = _FallbackSettings()  # type: ignore


@dataclass
class VoiceEntry:
    voice_id: str
    last_used_at: Optional[datetime] = None
    orphaned: bool = False
    deletion_pending: bool = False


class ProviderVoicePool:
    """In-memory LRU index over provider voices.

    Not thread-safe across processes. Single-process assumption for now.
    Thread safety inside process provided by self._lock.
    """

    def __init__(self, capacity: Optional[int] = None):
        self.capacity = capacity or getattr(settings, "provider_pool_capacity", 10)
        self.enabled = getattr(settings, "provider_pool_enabled", False)
        self._voices: Dict[str, VoiceEntry] = {}
        self._lock = threading.RLock()

    # -------------------- Public API --------------------
    def list_voice_ids(self) -> List[str]:
        with self._lock:
            return list(self._voices.keys())

    def has_voice(self, voice_id: str) -> bool:
        if not self.enabled:
            return False
        with self._lock:
            return voice_id in self._voices

    def register_use(self, voice_id: str):
        if not self.enabled or not voice_id:
            return
        now = datetime.now(timezone.utc)
        with self._lock:
            entry = self._voices.get(voice_id)
            if entry is None:
                # Lazy add (voice existed in provider but not yet known)
                entry = VoiceEntry(voice_id=voice_id)
                self._voices[voice_id] = entry
            entry.last_used_at = now
            # Metrics TODO: increment use counter gauge/histogram

    def ensure_capacity_then_create(self, create_fn) -> Optional[str]:
        """Ensure there is capacity, evicting one if needed, then create a voice.

        create_fn: callable returning new voice_id (str) or None.
        """
        if not self.enabled:
            # Direct create without pool semantics
            return create_fn()
        with self._lock:
            if len(self._voices) >= self.capacity:
                self._evict_one_locked()
            voice_id = create_fn()
            if voice_id:
                self._voices[voice_id] = VoiceEntry(voice_id=voice_id, last_used_at=datetime.now(timezone.utc))
            return voice_id

    def reconcile(self):  # pragma: no cover - scaffold only
        if not self.enabled:
            return
        # TODO: List provider voices, add missing entries, mark orphaned, handle deletion_pending retries.
        pass

    # -------------------- Internal Helpers --------------------
    def _evict_one_locked(self):
        """Pick oldest (LRU) or orphaned voice and evict (remote delete stub)."""
        if not self._voices:
            return
        # Compute candidate ordering
        def score(e: VoiceEntry):
            ts = e.last_used_at or datetime.fromtimestamp(0, tz=timezone.utc)
            return (0 if e.orphaned else 1, ts)  # orphaned first, then oldest ts
        victim_id, victim_entry = min(self._voices.items(), key=lambda kv: score(kv[1]))
        # Remote delete (stub)
        try:
            self._delete_remote_voice_stub(victim_id)
        except Exception:
            # If delete fails mark deletion_pending and keep for later retry
            victim_entry.deletion_pending = True
            return
        # Success remove
        del self._voices[victim_id]
        # TODO: metric eviction counter

    def _delete_remote_voice_stub(self, voice_id: str):  # pragma: no cover
        # TODO: integrate ElevenLabs delete API call
        # Placeholder: print / no-op
        print({"event": "provider_pool_delete_stub", "voice_id": voice_id})


# Singleton-like accessor (lazy)
_POOL_SINGLETON: Optional[ProviderVoicePool] = None


def get_provider_voice_pool() -> ProviderVoicePool:
    global _POOL_SINGLETON
    if _POOL_SINGLETON is None:
        _POOL_SINGLETON = ProviderVoicePool()
    return _POOL_SINGLETON
