import json
from pathlib import Path
from functools import lru_cache
from typing import Dict

BASE_DIR = Path(__file__).resolve().parents[1]
COST_FILE = BASE_DIR / "docs" / "elevenlabs_models_cost.json"

@lru_cache(maxsize=1)
def _load_costs() -> Dict[str, float]:
    if not COST_FILE.exists():
        return {}
    try:
        data = json.loads(COST_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}
    models = data.get("models", [])
    mapping: Dict[str, float] = {}
    for m in models:
        mid = m.get("model_id")
        cf = m.get("cost_factor")
        if isinstance(mid, str) and isinstance(cf, (int, float)):
            mapping[mid] = float(cf)
    return mapping

def get_elevenlabs_model_cost_factor(model_id: str) -> float:
    """
    Devuelve el factor de coste relativo para un model_id.
    Si no existe, retorna 1.0 (neutral).
    """
    return _load_costs().get(model_id, 1.0)
