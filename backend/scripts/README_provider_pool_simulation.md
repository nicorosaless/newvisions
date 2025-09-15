# Provider Voice Pool Simulation

Script: `simulate_provider_pool.py`

Objetivo: Validar comportamiento de evicción LRU cuando la capacidad (10) se excede creando una voz 11.

Secuencia interna:
1. Crea voces para usuarios `u1..u10` (voice_uX) y registra un uso.
2. Aplica un uso extra a `u6..u10` para que estos sean más recientes.
3. Crea voz `u11` -> debe evictar la menos reciente (u1).
4. Reusa `u10` para confirmar que sigue presente.
5. Detecta que `u1` ya no está y marca `reclone_required`.

Ejecución:
```bash
python -m backend.scripts.simulate_provider_pool
```

Salida esperada (resumida):
```
{"event": "create", "user": "u1", ...}
...
{"event": "create", "user": "u10", ...}
-- After initial 10 --
voices ['voice_u1', ..., 'voice_u10']
{"event": "extra_use", "user": "u6"}
...
{"event": "extra_use", "user": "u10"}
{"event": "create", "user": "u11", "voice_id": "voice_u11"}
{"event": "eviction_check", "expected_evicted": "voice_u1", "evicted": true}
{"event": "reuse", "user": "u10", "present": true}
{"event": "perform_missing_voice", "user": "u1", "action": "reclone_required"}
```

Si `evicted` es `false`, la política de selección LRU no está actuando como se espera y debe revisarse `_evict_one_locked`.

Notas:
- Este script no llama a la API de ElevenLabs ni al backend FastAPI; usa el pool en memoria directamente.
- Para pruebas más realistas se deberá integrar list/delete reales y hooks de creación.
