from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime

from .config import settings
import re
def get_subscription_info() -> Dict[str, Any]:
    info: Dict[str, Any] = {}
    try:
        if not settings.elevenlabs_api_key:
            return info
        from elevenlabs.client import ElevenLabs  # type: ignore
        client = ElevenLabs(api_key=settings.elevenlabs_api_key)
        user = client.user.get()
        sub = getattr(user, "subscription", None)
        if sub is None and isinstance(user, dict):
            sub = user.get("subscription")
        sub_dict = None
        # Handle ElevenLabs SDK response objects (Pydantic-like)
        if sub is not None:
            try:
                if hasattr(sub, "model_dump") and callable(getattr(sub, "model_dump")):
                    sub_dict = sub.model_dump()
                elif hasattr(sub, "dict") and callable(getattr(sub, "dict")):
                    sub_dict = sub.dict()
            except Exception:
                sub_dict = None
        if sub_dict is None:
            if isinstance(sub, dict):
                sub_dict = sub
            elif sub is not None:
                # Fallback: access attributes directly
                sub_dict = {
                    "voice_slots_used": getattr(sub, "voice_slots_used", None),
                    "voice_limit": getattr(sub, "voice_limit", None),
                    "professional_voice_slots_used": getattr(sub, "professional_voice_slots_used", None),
                    "professional_voice_limit": getattr(sub, "professional_voice_limit", None),
                    "tier": getattr(sub, "tier", None),
                }
            else:
                sub_dict = {}
        # Expose key fields for slots
        info = {
            "voice_slots_used": sub_dict.get("voice_slots_used"),
            "voice_limit": sub_dict.get("voice_limit"),
            "professional_voice_slots_used": sub_dict.get("professional_voice_slots_used"),
            "professional_voice_limit": sub_dict.get("professional_voice_limit"),
            "tier": sub_dict.get("tier"),
        }
    except Exception as e:
        print({"event": "preperform_error", "stage": "get_subscription", "error": str(e)})
    return info


def _parse_last_used(v) -> Optional[str]:
    try:
        labels = getattr(v, "labels", None) or (v.get("labels") if isinstance(v, dict) else None) or {}
        if isinstance(labels, dict):
            ts = labels.get("last_used_at") or labels.get("mru_ts")
            if ts:
                return str(ts)
        # Fallback: parse from description if present like "last_used_at=ISO" or "ts=ISO"
        desc = getattr(v, "description", None) or (v.get("description") if isinstance(v, dict) else None)
        if isinstance(desc, str):
            import re
            m = re.search(r"(?:last_used_at|ts)\s*[:=]\s*([0-9T:\-.Z+]+)", desc)
            if m:
                return m.group(1)
    except Exception:
        return None
    return None


def list_elevenlabs_voice_names() -> List[str]:
    names: List[str] = []
    try:
        if not settings.elevenlabs_api_key:
            return names
        from elevenlabs.client import ElevenLabs  # type: ignore
        client = ElevenLabs(api_key=settings.elevenlabs_api_key)
        resp = client.voices.get_all()
        # SDK returns .voices which are objects; tolerate dict too
        voices = getattr(resp, "voices", resp) or []
        allowed_name = re.compile(r"(^user_\w+)|(^sim_user_\w+)|(_voice$)|(^test_)", re.IGNORECASE)
        for v in voices:
            try:
                name = getattr(v, "name", None) or (v.get("name") if isinstance(v, dict) else None)
                category = getattr(v, "category", None) or (v.get("category") if isinstance(v, dict) else None)
                if not name:
                    continue
                # Keep only account-owned voices (consume slots): category != premade
                if isinstance(category, str) and category.lower() == "premade":
                    continue
                # If category missing, allow our naming fallback
                if category is None and not allowed_name.search(str(name)):
                    continue
                names.append(str(name))
            except Exception:
                continue
    except Exception as e:
        print({"event": "preperform_error", "stage": "list_voices", "error": str(e)})
    return names


def list_elevenlabs_voices_mru() -> List[Dict[str, Any]]:
    items: List[Tuple[Optional[str], Dict[str, Any]]] = []
    try:
        if not settings.elevenlabs_api_key:
            return []
        from elevenlabs.client import ElevenLabs  # type: ignore
        client = ElevenLabs(api_key=settings.elevenlabs_api_key)
        resp = client.voices.get_all()
        voices = getattr(resp, "voices", resp) or []
        allowed_name = re.compile(r"(^user_\w+)|(^sim_user_\w+)|(_voice$)|(^test_)", re.IGNORECASE)
        for v in voices:
            try:
                name = getattr(v, "name", None) or (v.get("name") if isinstance(v, dict) else None)
                category = getattr(v, "category", None) or (v.get("category") if isinstance(v, dict) else None)
                voice_id = getattr(v, "voice_id", None) or (v.get("voice_id") if isinstance(v, dict) else None)
                if not name or not voice_id:
                    continue
                labels = getattr(v, "labels", None) or (v.get("labels") if isinstance(v, dict) else None) or {}
                # Keep only account-owned: category != premade; if category missing, allow our naming fallback
                if isinstance(category, str) and category.lower() == "premade":
                    continue
                if category is None and not allowed_name.search(str(name)):
                    continue
                last_used = _parse_last_used(v)
                desc = getattr(v, "description", None) or (v.get("description") if isinstance(v, dict) else None)
                items.append((last_used, {"name": str(name), "voice_id": str(voice_id), "last_used_at": last_used, "labels": labels, "description": desc}))
            except Exception:
                continue
    except Exception as e:
        print({"event": "preperform_error", "stage": "voices_mru", "error": str(e)})
        return []
    # Sort by last_used desc (MRU first); None goes last
    def sort_key(item: Tuple[Optional[str], Dict[str, Any]]):
        ts = item[0]
        # ISO-compatible sort by string works if uniform; ensure None is smallest
        return (ts is None, ts)
    items.sort(key=sort_key, reverse=True)
    return [d for _, d in items]


def materialize_enqueue(db, *, user_id: Optional[str], voice_clone_id: Optional[str], create_if_missing: bool = False) -> Dict[str, Any]:
    """Apply the simulated enqueue at the provider:
    - If user's voice exists at provider: touch to MRU (update last_used_at)
    - Else: if capacity full: delete LRU to free a slot
    - Optionally create the user's voice now when create_if_missing=True (default False)
    Returns a summary with action taken and any evicted voice.
    """
    result: Dict[str, Any] = {"action": None}
    if not settings.elevenlabs_api_key:
        result.update({"error": "missing_api_key"})
        return result
    import requests
    headers = {"xi-api-key": settings.elevenlabs_api_key}

    subscription = get_subscription_info()
    mru_list = list_elevenlabs_voices_mru()
    sub_limit = subscription.get("voice_limit")
    limit = int(sub_limit) if isinstance(sub_limit, int) and sub_limit > 0 else 10
    sub_used = subscription.get("voice_slots_used")
    used = int(sub_used) if isinstance(sub_used, int) and sub_used >= 0 else len(mru_list)
    is_full = int(used) >= int(limit)

    # Resolve target name
    target_name = (voice_clone_id or (f"user_{str(user_id)[-8:]}_voice" if user_id else "new_user_voice")).strip()

    # Find existing provider voice for this user
    existing = None
    for v in mru_list:
        labels = v.get("labels") or {}
        if user_id and str(labels.get("user_id")) == str(user_id):
            existing = v
            break
        if v.get("name") == target_name:
            existing = v
            break

    now_iso = datetime.utcnow().isoformat() + "Z"

    if existing:
        # Touch to MRU by updating last_used_at and description
        vid = existing.get("voice_id")
        if vid:
            try:
                labels = existing.get("labels") or {}
                labels.update({"last_used_at": now_iso, "source": "newvisions"})
                json_payload = {"description": f"last_used_at:{now_iso}", "labels": labels}
                r = requests.post(
                    f"https://api.elevenlabs.io/v1/voices/{vid}/edit",
                    headers={**headers, "Content-Type": "application/json"},
                    json=json_payload,
                    timeout=30,
                )
                # Persist provider mapping in DB for this user
                try:
                    if user_id:
                        from bson import ObjectId  # type: ignore
                        users_coll = db["users"]
                        users_coll.update_one(
                            {"_id": ObjectId(user_id)},
                            {"$set": {
                                "voice_clone_id": vid or target_name,
                                "voice_clone_name": target_name,
                                "voice_clone_provider": "elevenlabs",
                                "provider_voice_id": vid,
                                "voice_clone_updated_at": datetime.utcnow()
                            }}
                        )
                except Exception:
                    pass
                result.update({"action": "touched_existing_mru", "new_user": {"user_id": user_id, "voice_clone_id": target_name}, "voice_id": vid, "name": existing.get("name"), "status_code": r.status_code})
            except Exception as e:
                result.update({"action": "touch_failed", "error": str(e)})
        else:
            result.update({"action": "touch_skipped", "reason": "missing_voice_id"})
        return {**result, "is_full": is_full, "used": used, "limit": limit, "slots_after": list_elevenlabs_voices_mru()}

    # Not existing at provider
    evicted = None
    if is_full and mru_list:
        lru = mru_list[-1]
        lru_vid = lru.get("voice_id")
        try:
            if lru_vid:
                dr = requests.delete(f"https://api.elevenlabs.io/v1/voices/{lru_vid}", headers=headers, timeout=30)
                evicted = {"name": lru.get("name"), "voice_id": lru_vid, "status_code": dr.status_code}
        except Exception as e:
            result.update({"action": "evict_failed", "error": str(e)})
            return {**result, "is_full": is_full, "used": used, "limit": limit}

    if create_if_missing:
        # Create the user's voice now using stored sample (if available)
        try:
            if not user_id:
                raise RuntimeError("missing_user_id")
            from bson import ObjectId  # type: ignore
            users = db["users"]
            oid = ObjectId(user_id)
            u = users.find_one({"_id": oid}, {"recordedVoiceBinary": 1}) or {}
            blob = u.get("recordedVoiceBinary")
            if not blob:
                raise RuntimeError("missing_sample")
            import requests as _rq
            files = [("files", (f"{target_name}.mp3", blob, "audio/mpeg"))]
            labels = {"created_at": now_iso, "last_used_at": now_iso, "source": "newvisions", "user_id": str(user_id)}
            data = {"name": target_name, "description": f"created_at:{now_iso}", "labels": reformat_labels(labels)}
            pr = _rq.post("https://api.elevenlabs.io/v1/voices/add", headers=headers, files=files, data=data, timeout=90)
            vid = None
            try:
                vid = pr.json().get("voice_id")
            except Exception:
                pass
            # Persist provider mapping in DB for this user
            try:
                if user_id and vid:
                    from bson import ObjectId  # type: ignore
                    users_coll = db["users"]
                    users_coll.update_one(
                        {"_id": ObjectId(user_id)},
                        {"$set": {
                            "voice_clone_id": vid,
                            "voice_clone_name": target_name,
                            "voice_clone_provider": "elevenlabs",
                            "provider_voice_id": vid,
                            "voice_clone_updated_at": datetime.utcnow()
                        }}
                    )
            except Exception:
                pass
            result.update({"action": "created_new_mru", "new_user": {"user_id": user_id, "voice_clone_id": target_name}, "name": target_name, "voice_id": vid, "status_code": pr.status_code, "evicted": evicted})
            return {**result, "is_full": is_full, "used": used, "limit": limit, "slots_after": list_elevenlabs_voices_mru()}
        except Exception as e:
            result.update({"action": "create_failed", "error": str(e), "evicted": evicted})
            return {**result, "is_full": is_full, "used": used, "limit": limit, "slots_after": list_elevenlabs_voices_mru()}

    # Only freed a slot (if needed); creation will happen on next perform
    result.update({"action": "freed_slot" if evicted else "noop_capacity_ok", "new_user": {"user_id": user_id, "voice_clone_id": target_name}, "evicted": evicted})
    return {**result, "is_full": is_full, "used": used, "limit": limit, "slots_after": list_elevenlabs_voices_mru()}


def reformat_labels(labels: Dict[str, Any]) -> str:
    import json as _json
    return _json.dumps(labels)


def _map_voice_to_user_id(db, voice_id: str) -> Optional[str]:
    try:
        users = db["users"]
        doc = users.find_one({"voice_clone_id": voice_id}, {"_id": 1})
        if not doc:
            return None
        return str(doc.get("_id"))
    except Exception:
        return None


def get_lru_user_id(db) -> Optional[str]:
    try:
        # Prefer provider-derived MRU/LRU from labels timestamps
        voices = list_elevenlabs_voices_mru()
        if voices:
            lru = voices[-1]
            labels = lru.get("labels") or {}
            uid = labels.get("user_id")
            if uid:
                return str(uid)
            # Fallback: map provider voice_id to user record
            vid = lru.get("voice_id")
            if vid:
                mapped = _map_voice_to_user_id(db, str(vid))
                if mapped:
                    return mapped
        # Legacy fallback: use voice_pool collection if present
        coll = db["voice_pool"]
        doc = coll.find_one(sort=[["last_used_at", 1]])
        if not doc:
            return None
        return str(doc.get("user_id") or doc.get("userId") or doc.get("user"))
    except Exception as e:
        print({"event": "preperform_error", "stage": "lru_user", "error": str(e)})
        return None


def run(db, user_id: Optional[str] = None, voice_clone_id: Optional[str] = None) -> None:
    info = collect(db, user_id=user_id, voice_clone_id=voice_clone_id)
    # Pretty terminal output (REAL provider state only)
    print("[preperform] timestamp:", info.get("timestamp"))
    sub = info.get("subscription") or {}
    print(f"[preperform] slots: used={sub.get('voice_slots_used')} / limit={sub.get('voice_limit')} tier={sub.get('tier')}")
    mru = info.get("elevenlabs_voices_mru") or []
    if mru:
        top = mru[0]
        last = mru[-1]
        print(f"[preperform] MRU: {top.get('name')} ({top.get('voice_id')}) at {top.get('last_used_at')}")
        print(f"[preperform] LRU: {last.get('name')} ({last.get('voice_id')}) at {last.get('last_used_at')}")
        # Print REAL slots snapshot from provider (first 10)
        names = [f"{v.get('name')}({v.get('voice_id')})" for v in mru[:10]]
        print("[preperform] REAL slots:", ", ".join(names) + (" ..." if len(mru) > 10 else ""))


def collect(db, user_id: Optional[str] = None, voice_clone_id: Optional[str] = None) -> Dict[str, Any]:
    names = list_elevenlabs_voice_names()
    mru_list = list_elevenlabs_voices_mru()
    lru_user = get_lru_user_id(db)
    subscription = get_subscription_info()
    simulation = simulate_enqueue_as_mru(user_id=user_id, voice_clone_id=voice_clone_id, mru_list=mru_list, subscription=subscription)
    return {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "elevenlabs_voice_names": names,
        "elevenlabs_voices_mru": mru_list,
        "subscription": subscription,
        "lru_voice": (mru_list[-1] if mru_list else None),
        "lru_user": lru_user,
        "simulation": simulation,
    }


def simulate_enqueue_as_mru(*, user_id: Optional[str], voice_clone_id: Optional[str], mru_list: List[Dict[str, Any]], subscription: Dict[str, Any]) -> Dict[str, Any]:
    try:
        limit = subscription.get("voice_limit")
        # Prefer provider-reported used slots when available
        used_reported = subscription.get("voice_slots_used")
        used = used_reported if isinstance(used_reported, int) else len(mru_list)
        if not isinstance(limit, int) or limit <= 0:
            limit = 10  # sensible default per request
        is_full = used >= limit
        # Resolve new user's intended provider voice name (equals our voice_clone_id)
        new_name: Optional[str] = None
        new_provider_voice_id: Optional[str] = None  # ElevenLabs voice_id if already present
        if voice_clone_id and isinstance(voice_clone_id, str) and voice_clone_id.strip():
            new_name = voice_clone_id.strip()
        elif user_id:
            # As a fallback, derive from user id
            new_name = f"user_{str(user_id)[-8:]}_voice"
        else:
            new_name = "new_user_voice"

        # Check if already present by labels.user_id OR by name match
        existing_idx = None
        for i, v in enumerate(mru_list):
            labels = v.get("labels") or {}
            if user_id and str(labels.get("user_id")) == str(user_id):
                existing_idx = i
                break
            if v.get("name") == new_name:
                existing_idx = i
                break
        evict = None
        after = []
        now_iso = datetime.utcnow().isoformat() + "Z"
        if existing_idx is not None:
            # Move to front (MRU update)
            existing = mru_list[existing_idx]
            new_provider_voice_id = existing.get("voice_id")
            existing = {**existing, "last_used_at": now_iso}
            others = [v for i, v in enumerate(mru_list) if i != existing_idx]
            after = [existing] + others
            action = "touch_existing_mru"
        else:
            # Insert new at MRU, evict if full
            if is_full and mru_list:
                evict = mru_list[-1]
                remaining = mru_list[:-1]
            else:
                remaining = mru_list
            new_entry = {"name": new_name, "voice_id": new_provider_voice_id or new_name, "last_used_at": now_iso, "labels": {"user_id": user_id, "source": "newvisions"}}
            after = [new_entry] + remaining
            action = "evict_and_insert" if evict else "insert_as_mru"

        return {
            "action": action,
            "new_user": {"user_id": user_id, "voice_clone_id": new_name},
            "is_full": is_full,
            "used_before": used,
            "limit": limit,
            "evict": evict,
            "insert": {"user_id": user_id, "voice_id": new_provider_voice_id or new_name, "name": new_name},
            "mru_after_preview": after,
            "slots_after": after,
        }
    except Exception as e:
        print({"event": "preperform_error", "stage": "simulate_enqueue", "error": str(e)})
        return {}
