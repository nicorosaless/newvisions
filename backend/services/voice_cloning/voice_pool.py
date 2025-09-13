import time
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from pymongo import ReturnDocument

from backend.config import settings

# NOTE: Keep dependencies minimal; pass db explicitly from request scope to avoid tight coupling.

POOL_COLLECTION = "voice_pool"


def _hash_sample(sample_bytes: bytes) -> str:
    return hashlib.sha256(sample_bytes).hexdigest()


class VoicePoolManager:
    """Manages a capped pool (LRU) of persistent ElevenLabs voice IDs.

    Document shape (voice_pool):
    {
      _id,
      voice_id: str,
      sample_hash: str,
      users: [user_id, ...],
      created_at: datetime,
      last_used_at: datetime,
      reuse_count: int,
      bytes_len: int,
    }
    """

    def __init__(self, db):
        self.db = db
        self.capacity = settings.elevenlabs_pool_capacity
        self.ttl_minutes = settings.elevenlabs_pool_ttl_minutes
        self.enabled = settings.elevenlabs_pool_enabled

    # Public API
    def acquire_voice(self, user_id: str, sample_bytes: Optional[bytes]) -> Optional[str]:
        """Return a pooled voice_id if possible; else None (caller falls back to ephemeral).
        Strategy:
          1. If disabled or no sample -> None
          2. If user already has voice_clone_id in users collection (future extension) -> return it
          3. Reuse existing pool entry matching hash
          4. If capacity not full -> create new (caller must perform remote clone then register)
        We split creation in two steps so that remote errors don't leave dangling docs.
        """
        if not self.enabled or not sample_bytes:
            return None

        sample_hash = _hash_sample(sample_bytes)

        # Try existing entry by hash
        entry = self.db[POOL_COLLECTION].find_one({"sample_hash": sample_hash})
        if entry:
            self._touch(entry["_id"], user_id)
            return entry["voice_id"]

        # Capacity check
        current_count = self.db[POOL_COLLECTION].count_documents({})
        if current_count >= self.capacity:
            # Evict LRU (oldest last_used_at)
            lru = self.db[POOL_COLLECTION].find_one(sort=[("last_used_at", 1)])
            if lru:
                # Caller should delete remote voice AFTER acquiring new remote clone.
                # We return None to signal need for creation; store lru id for potential cleanup via register_new_voice.
                # For simplicity we delete now (risk: remote voice deletion failure not tracked). TODO: improve reliability.
                self.db[POOL_COLLECTION].delete_one({"_id": lru["_id"]})
        # Signal caller to create new remote clone and then call register_new_voice
        return None

    def register_new_voice(self, user_id: str, sample_bytes: bytes, voice_id: str) -> str:
        sample_hash = _hash_sample(sample_bytes)
        now = datetime.utcnow()
        doc = {
            "voice_id": voice_id,
            "sample_hash": sample_hash,
            "users": [user_id],
            "created_at": now,
            "last_used_at": now,
            "reuse_count": 0,
            "bytes_len": len(sample_bytes),
        }
        self.db[POOL_COLLECTION].insert_one(doc)
        return voice_id

    def _touch(self, doc_id, user_id: str):
        self.db[POOL_COLLECTION].find_one_and_update(
            {"_id": doc_id},
            {"$set": {"last_used_at": datetime.utcnow()}, "$addToSet": {"users": user_id}, "$inc": {"reuse_count": 1}},
            return_document=ReturnDocument.AFTER,
        )

    def cleanup_expired(self):
        if not self.enabled:
            return 0
        cutoff = datetime.utcnow() - timedelta(minutes=self.ttl_minutes)
        res = self.db[POOL_COLLECTION].delete_many({"last_used_at": {"$lt": cutoff}})
        return res.deleted_count


# Helper factory (avoid global singletons in tests)

def get_voice_pool(db):
    return VoicePoolManager(db)
