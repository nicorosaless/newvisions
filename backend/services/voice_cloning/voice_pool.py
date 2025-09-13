from datetime import datetime, timedelta
from typing import Optional

from backend.config import settings

POOL_COLLECTION = "voice_pool"


class VoicePoolManager:
    """LRU pool de voice_ids persistentes per-user.

    Document shape nuevo (voice_pool):
    {
      _id,
      voice_id: str,      # igual a users.voice_clone_id
      user_id: str,
      created_at: datetime,
      last_used_at: datetime,
      reuse_count: int,
    }
    """

    def __init__(self, db):
        self.db = db
        self.capacity = settings.elevenlabs_pool_capacity
        self.ttl_minutes = settings.elevenlabs_pool_ttl_minutes
        self.enabled = settings.elevenlabs_pool_enabled

    def has_voice(self, voice_id: str) -> bool:
        if not self.enabled:
            return False
        return self.db[POOL_COLLECTION].find_one({"voice_id": voice_id}, {"_id": 1}) is not None

    def ensure_voice(self, voice_id: str, user_id: str):
        """Garantiza que voice_id esté en el pool como MRU.
        Si ya existe → touch. Si no existe → si lleno evict LRU y luego insert.
        """
        if not self.enabled or not voice_id:
            return
        coll = self.db[POOL_COLLECTION]
        doc = coll.find_one({"voice_id": voice_id})
        now = datetime.utcnow()
        if doc:
            coll.update_one({"_id": doc["_id"]}, {"$set": {"last_used_at": now}, "$inc": {"reuse_count": 1}})
            return
        count = coll.count_documents({})
        if count >= self.capacity:
            lru = coll.find_one(sort=[("last_used_at", 1)])
            if lru:
                coll.delete_one({"_id": lru["_id"]})
                # TODO: programar borrado remoto async del recurso si política lo exige
        coll.insert_one({
            "voice_id": voice_id,
            "user_id": user_id,
            "created_at": now,
            "last_used_at": now,
            "reuse_count": 0,
        })

    def cleanup_expired(self) -> int:
        if not self.enabled:
            return 0
        cutoff = datetime.utcnow() - timedelta(minutes=self.ttl_minutes)
        res = self.db[POOL_COLLECTION].delete_many({"last_used_at": {"$lt": cutoff}})
        return res.deleted_count


def get_voice_pool(db):
    return VoicePoolManager(db)
