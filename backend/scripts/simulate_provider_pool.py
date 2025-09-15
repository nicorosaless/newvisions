"""Simulation script for provider-backed voice pool eviction behavior.

Goal:
 - Capacity = 10
 - Create voices for users u1..u10 (register uses in order 1..10)
 - Create voice for user u11 -> should evict LRU (u1 if all used once in increasing recency order)
 - Re-use user10 -> remains
 - Attempt perform by evicted user (u1) -> detect missing voice (simulated) -> needs re-clone

This uses the in-memory ProviderVoicePool directly; it does NOT hit ElevenLabs.
"""
from datetime import datetime, timezone
from backend.services.voice_cloning.provider_pool import ProviderVoicePool


def fake_create_factory(user_id: str):
    def _create():
        # Voice id just equal to uid + timestamp for uniqueness (stable for test run)
        return f"voice_{user_id}"
    return _create


def main():
    pool = ProviderVoicePool(capacity=10)
    pool.enabled = True  # force enable for simulation

    users = [f"u{i}" for i in range(1, 12)]  # u1..u11
    # Step 1: create voices u1..u10
    for uid in users[:10]:
        vid = pool.ensure_capacity_then_create(fake_create_factory(uid))
        if vid:
            pool.register_use(vid)
        print({"event": "create", "user": uid, "voice_id": vid})

    print("-- After initial 10 --")
    print("voices", pool.list_voice_ids())

    # Step 2: register incremental second use for later users to skew recency
    for uid in users[5:10]:  # u6..u10 become most recent
        vid = f"voice_{uid}"
        pool.register_use(vid)
        print({"event": "extra_use", "user": uid})

    # Step 3: create voice for u11 -> triggers eviction of LRU (expected u1)
    vid11 = pool.ensure_capacity_then_create(fake_create_factory("u11"))
    if vid11:
        pool.register_use(vid11)
    print({"event": "create", "user": "u11", "voice_id": vid11})

    print("-- After adding u11 (eviction occurred) --")
    print("voices", pool.list_voice_ids())

    # Show which user voice got evicted (u1 should be missing)
    expected_evicted = "voice_u1"
    evicted = expected_evicted not in pool.list_voice_ids()
    print({"event": "eviction_check", "expected_evicted": expected_evicted, "evicted": evicted})

    # Step 4: reuse user10 (should still exist)
    pool.register_use("voice_u10")
    print({"event": "reuse", "user": "u10", "present": "voice_u10" in pool.list_voice_ids()})

    # Step 5: simulate perform by evicted user u1
    if expected_evicted not in pool.list_voice_ids():
        print({"event": "perform_missing_voice", "user": "u1", "action": "reclone_required"})
    else:
        print({"event": "perform_voice_still_present_unexpected", "user": "u1"})


if __name__ == "__main__":
    main()
