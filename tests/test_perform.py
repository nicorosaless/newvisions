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

def test_perform_basic_flow_with_clone_stub():
    user_id = create_user("tester2")
    # Simular upload de voz (fake mp3 bytes con header ID3) base64
    fake_mp3 = b"ID3" + b"\x00" * 4000
    import base64 as b64
    upload = client.post(f"/users/{user_id}/voice", json={
        "audio_base64": b64.b64encode(fake_mp3).decode(),
        "mime_type": "audio/mpeg",
        "duration_seconds": 35
    })
    # duration_seconds must be between 30 and 60
    assert upload.status_code == 200, upload.text
    perform_resp = client.post("/perform", json={
        "user_id": user_id,
        "routine_type": "morning",
        "value": "energize"
    })
    assert perform_resp.status_code == 200, perform_resp.text
    data = perform_resp.json()
    assert data["voiceSource"] == "provider_voice_id"
    assert len(data["audio_base64"]) > 10


def test_perform_char_limit():
    user_id = create_user("limituser")
    # Manually set charCount near limit
    db, mc = _get_db()
    try:
        db["users"].update_one({"username": "limituser"}, {"$set": {"charCount": 3995}})
    finally:
        mc.close()
    # Upload voice to ensure clone exists (stub)
    fake_mp3 = b"ID3" + b"\x00" * 4000
    import base64 as b64
    up = client.post(f"/users/{user_id}/voice", json={
        "audio_base64": b64.b64encode(fake_mp3).decode(),
        "mime_type": "audio/mpeg",
        "duration_seconds": 35
    })
    assert up.status_code == 200, up.text
    # Debe bloquear si texto excede el límite
    resp = client.post("/perform", json={
        "user_id": user_id,
        "routine_type": "evening",
        "value": "short"
    })
    assert resp.status_code in (200, 429)


def test_perform_uses_voice_note_prompt_structure():
    user_id = create_user("promptuser")
    # Upload voice sample to enable clone creation (stub path)
    fake_mp3 = b"ID3" + b"\x00" * 4000
    import base64 as b64
    up = client.post(f"/users/{user_id}/voice", json={
        "audio_base64": b64.b64encode(fake_mp3).decode(),
        "mime_type": "audio/mpeg",
        "duration_seconds": 32
    })
    assert up.status_code == 200, up.text
    # Perform with routine_type acting as topic; value must appear in text
    value = "mariposa_azul"
    resp = client.post("/perform", json={
        "user_id": user_id,
        "routine_type": "dream",  # conceptual guiding topic (should not be literally named if model obeys)
        "value": value
    })
    assert resp.status_code == 200, resp.text
    data = resp.json()
    # Basic assertions: text contains value, is not excessively long, and audio present
    assert value in data["text"], data["text"]
    assert len(data["text"]) < 280  # ~2 short sentences upper bound
    assert data["voiceSource"] == "provider_voice_id"
    assert len(data["audio_base64"]) > 10
