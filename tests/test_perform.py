import base64
from fastapi.testclient import TestClient
from backend.main import app
import time
from backend.config import settings
from pymongo import MongoClient
from bson import ObjectId

client = TestClient(app)

def _get_db():
    mc = MongoClient(settings.mongo_uri)
    return mc["voicememos_db"], mc

def create_user(username_prefix="tester"):
    db, mc = _get_db()
    try:
        users = db["users"]
        # ensure collection exists; remove potential stale doc with same username
        unique = f"{username_prefix}_{int(time.time()*1000)}"
        user_doc = {
            "username": unique,
            "email": f"{unique}@example.com",
            "password": b"hash",  # simplified for test
            "voice_clone_id": None,
            "charCount": 0,
            "settings": {},
        }
        _id = users.insert_one(user_doc).inserted_id
        return str(_id)
    finally:
        mc.close()

def test_perform_empty_value():
    user_id = create_user()
    resp = client.post("/perform", json={
        "user_id": user_id,
        "routine_type": "morning",
        "value": ""
    })
    assert resp.status_code == 400
    assert "empty" in resp.json()["detail"].lower()

def test_perform_basic_flow():
    user_id = create_user("tester2")
    resp = client.post("/perform", json={
        "user_id": user_id,
        "routine_type": "morning",
        "value": "energize"
    })
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "text" in data and len(data["text"]) > 0
    assert data["charCount"] >= len(data["text"])
    assert data["voiceSource"] in ("provider_voice_id", "pooled_voice_id", "user_sample", "tts")


def test_perform_char_limit():
    user_id = create_user("limituser")
    # Manually set charCount near limit
    db, mc = _get_db()
    try:
        db["users"].update_one({"username": "limituser"}, {"$set": {"charCount": 3995}})
    finally:
        mc.close()
    resp = client.post("/perform", json={
        "user_id": user_id,
        "routine_type": "evening",
        "value": "short"
    })
    # Either allowed (if generated text fits) or blocked if exceeds; ensure no server error
    assert resp.status_code in (200, 429)
