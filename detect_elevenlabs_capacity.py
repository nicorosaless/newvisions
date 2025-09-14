#!/usr/bin/env python3
"""Herramienta de inspección ElevenLabs

Objetivo: recopilar la máxima información posible de la API pública de ElevenLabs
usando la API key provista en la variable de entorno ELEVEN_LABS_API_KEY para
inferir/estimar la capacidad máxima de voces clonadas (voice slots) disponible
para el plan actual y exponer métricas de uso.

Nota importante: ElevenLabs no expone (a la fecha) un endpoint directo que
devuelva 'max_voice_slots'. Algunos planes anuncian límites (p.ej. 10 voces
clonadas) fuera de la API. Por tanto, este script intenta:

1. Listar voces existentes (`GET /v1/voices`) y contar cuántas son clonadas
   frente a voces base.
2. Obtener modelos disponibles (`GET /v1/models`) para contexto.
3. (Opcional) Intentar una creación simulada en modo seco si la API algún día
   soporta un flag (actualmente NO documentado). No se ejecuta por defecto.
4. Inferir heurísticamente si el límite está cerca:
   - Si el número de voces clonadas coincide con valores típicos de planes
     (5, 10, 30, etc.) se sugiere ese valor como posible slot cap.
   - Si la respuesta al intentar crear (cuando se habilite la sección opcional)
     devuelve HTTP 4xx con mensaje de límite alcanzado, se captura.
5. Cuando el endpoint de suscripción devuelve campos explícitos (e.g. voice_limit),
   se marca exact_cap_confirmed y se añade confirmed_cap.
6. Cálculo de ratios de uso: character_usage_ratio y voice_usage_ratio si hay datos.
7. Exportar un JSON resumen y mostrarlo en stdout.

Requisitos: requests>=2.32 instalado (ya en requirements.txt) y una API Key válida.

Uso:
  python detect_elevenlabs_capacity.py
    python detect_elevenlabs_capacity.py --subscription-only

Variables de entorno relevantes:
  ELEVEN_LABS_API_KEY  (obligatoria)

Salida: imprime tabla y un JSON final para fácil parseo.

Campos relevantes del JSON de salida:
    capacity_inference: incluye exact_cap_confirmed y confirmado si se obtuvo.
    plan.max_voice_slots_estimate: estimación final (confirmada si había voice_limit).
    usage_ratios: ratios de uso de caracteres y voces.
    subscription_extracted: subset de campos de la suscripción para depuración.
"""

from __future__ import annotations
import os
import sys
import json
import time
import argparse  # mantenido sólo si se quisiera extender de nuevo; no se usa realmente
from typing import Any, Dict, List

from dotenv import load_dotenv  # type: ignore
import requests

# Cargar variables de entorno desde .env lo antes posible
load_dotenv()

API_BASE = "https://api.elevenlabs.io"
VOICES_ENDPOINT = f"{API_BASE}/v1/voices"
MODELS_ENDPOINT = f"{API_BASE}/v1/models"
USER_ENDPOINT = f"{API_BASE}/v1/user"
SUB_ENDPOINT = f"{API_BASE}/v1/user/subscription"


def _get_api_key() -> str:
    key = os.getenv("ELEVEN_LABS_API_KEY")
    if not key:
        print("[ERROR] Falta ELEVEN_LABS_API_KEY en el entorno", file=sys.stderr)
        sys.exit(1)
    return key


def fetch_json(url: str, api_key: str, timeout: int = 30) -> Dict[str, Any]:
    headers = {"xi-api-key": api_key}
    try:
        r = requests.get(url, headers=headers, timeout=timeout)
        r.raise_for_status()
        return r.json()
    except requests.HTTPError as e:
        return {"error": True, "status_code": r.status_code, "message": str(e), "body": safe_json(r)}
    except Exception as e:  # pragma: no cover
        return {"error": True, "message": str(e)}


def safe_json(resp: requests.Response) -> Any:
    try:
        return resp.json()
    except Exception:
        return resp.text[:500]


def classify_voice(v: Dict[str, Any]) -> str:
    """Heurística para clasificar una voz:
    - cloned: si tiene campos típicos de voces de usuario (ej: 'category': 'cloned' o flags)
    - premade: voces base del sistema
    - other: cualquier otra categoría
    """
    category = (v.get("category") or v.get("voice_category") or "").lower()
    if "clone" in category:
        return "cloned"
    # Algunos planes etiquetan voces de usuario como 'generated' o 'custom'
    if category in {"generated", "custom", "user"}:
        return "cloned"
    if category in {"premade", "professional", "classic"}:
        return "premade"
    return "other"


def infer_possible_cap(current_cloned: int) -> Dict[str, Any]:
    typical_caps = [5, 10, 15, 20, 30, 50]
    suggestions = [cap for cap in typical_caps if current_cloned <= cap]
    likely = suggestions[0] if suggestions else None
    return {
        "current_cloned_count": current_cloned,
        "typical_caps_considered": typical_caps,
        "first_feasible_cap": likely,
        "exact_cap_confirmed": False,
        "notes": "'first_feasible_cap' es el menor límite típico >= clones actuales; no garantiza que sea el real."
    }


def gather(api_key: str) -> Dict[str, Any]:
    print('[DEBUG] gather() start', flush=True)
    start = time.time()
    voices_data = fetch_json(VOICES_ENDPOINT, api_key)
    print('[DEBUG] voices fetched', flush=True)
    models_data = fetch_json(MODELS_ENDPOINT, api_key)
    print('[DEBUG] models fetched', flush=True)
    user_data = fetch_json(USER_ENDPOINT, api_key)
    print('[DEBUG] user fetched', flush=True)
    sub_data = fetch_json(SUB_ENDPOINT, api_key)
    print('[DEBUG] subscription fetched', flush=True)

    cloned_count = 0
    premade_count = 0
    other_count = 0
    voice_summaries: List[Dict[str, Any]] = []

    if not voices_data.get("error"):
        voices = voices_data.get("voices") or voices_data.get("voices_list") or []
        for v in voices:
            if not isinstance(v, dict):
                continue
            kind = classify_voice(v)
            if kind == "cloned":
                cloned_count += 1
            elif kind == "premade":
                premade_count += 1
            else:
                other_count += 1
            voice_summaries.append({
                "voice_id": v.get("voice_id"),
                "name": v.get("name"),
                "category": v.get("category") or v.get("voice_category"),
                "labels": v.get("labels"),
                "preview_url": v.get("preview_url"),
                "classification": kind
            })

    capacity_guess = infer_possible_cap(cloned_count)

    raw_models: List[Dict[str, Any]] = []
    if isinstance(models_data, list):
        for m in models_data:
            if isinstance(m, dict):
                raw_models.append(m)
    elif isinstance(models_data, dict):
        md = models_data.get("models")
        if isinstance(md, list):
            for m in md:
                if isinstance(m, dict):
                    raw_models.append(m)

    elapsed_ms = int((time.time() - start) * 1000)
    # Inferir plan / tier si es posible
    plan_name = None
    plan_tier = None
    if isinstance(sub_data, dict) and not sub_data.get('error'):
        plan_name = sub_data.get('tier') or sub_data.get('plan') or sub_data.get('subscription')
        plan_tier = sub_data.get('tier')

    # Heurística voice slots máximos:
    # 1. Si subscription incluye algún campo evidente (voice_limit, voice_clone_limit, max_characters etc.)
    # 2. Si no, usar mapping aproximado por tier conocido.
    # 3. Confirmar exact_cap_confirmed=True sólo si encontramos un campo numérico explícito.
    max_slots_field = None
    if isinstance(sub_data, dict) and not sub_data.get('error'):
        for k in ['voice_limit','voice_clone_limit','max_voice_clones','max_voices','voice_slots']:
            if k in sub_data and isinstance(sub_data[k], int):
                max_slots_field = sub_data[k]
                break

    tier_map = {
        'free': 5,
        'starter': 5,
        'creator': 10,
        'hobby': 10,
        'indie': 10,
        'pro': 30,
        'professional': 30,
        'scale': 50,
        'business': 50,
        'enterprise': 100
    }

    estimated_cap = max_slots_field
    if estimated_cap is None:
        if plan_name:
            key = str(plan_name).lower()
            estimated_cap = tier_map.get(key)
        if estimated_cap is None and plan_tier:
            estimated_cap = tier_map.get(str(plan_tier).lower())
    # Fallback: primer límite típico >= clones actuales
    if estimated_cap is None:
        estimated_cap = infer_possible_cap(cloned_count)['first_feasible_cap']

    capacity_guess['exact_cap_confirmed'] = max_slots_field is not None
    if max_slots_field is not None:
        capacity_guess['confirmed_cap'] = max_slots_field

    # Extraer más campos de suscripción
    subscription_extracted = None
    if isinstance(sub_data, dict):
        subscription_extracted = {
            'tier': sub_data.get('tier'),
            'character_count': sub_data.get('character_count'),
            'character_limit': sub_data.get('character_limit'),
            'voice_limit': sub_data.get('voice_limit'),
            'can_use_instant_voice_cloning': sub_data.get('can_use_instant_voice_cloning'),
            'can_use_professional_voice_cloning': sub_data.get('can_use_professional_voice_cloning'),
            'next_invoice': sub_data.get('next_invoice'),
            'billing_period': sub_data.get('billing_period'),
            'currency': sub_data.get('currency'),
            'status': sub_data.get('status'),
        }

    # Ratios de uso si hay datos suficientes
    character_usage_ratio = None
    voice_usage_ratio = None
    try:
        cc = subscription_extracted.get('character_count') if subscription_extracted else None
        cl = subscription_extracted.get('character_limit') if subscription_extracted else None
        if isinstance(cc, int) and isinstance(cl, int) and cl > 0:
            character_usage_ratio = round(cc / cl, 4)
        vl = subscription_extracted.get('voice_limit') if subscription_extracted else None
        if isinstance(vl, int) and vl > 0:
            voice_usage_ratio = round(cloned_count / vl, 4)
    except Exception:
        pass

    return {
        "elapsed_ms": elapsed_ms,
        "timestamp": int(time.time()),
        "voices_raw_error": voices_data.get("error", False),
        "models_raw_error": models_data.get("error", False),
        "user_raw_error": user_data.get("error", False),
        "subscription_raw_error": sub_data.get("error", False),
        "voices_raw_status": voices_data.get("status_code") if voices_data.get("error") else 200,
        "models_raw_status": models_data.get("status_code") if models_data.get("error") else 200,
        "user_raw_status": user_data.get("status_code") if user_data.get("error") else 200,
        "subscription_raw_status": sub_data.get("status_code") if sub_data.get("error") else 200,
        "counts": {
            "cloned": cloned_count,
            "premade": premade_count,
            "other": other_count,
            "total": cloned_count + premade_count + other_count
        },
        "capacity_inference": capacity_guess,
        "plan": {
            "plan_name": plan_name,
            "plan_tier": plan_tier,
            "max_voice_slots_estimate": estimated_cap,
            "source_field_present": max_slots_field is not None,
            "raw_subscription_keys": list(sub_data.keys()) if isinstance(sub_data, dict) else None
        },
        "usage_ratios": {
            "character_usage_ratio": character_usage_ratio,
            "voice_usage_ratio": voice_usage_ratio
        },
        "subscription_extracted": subscription_extracted,
        "voices": voice_summaries[:50],
        "models": [
            {
                "model_id": m.get("model_id"),
                "name": m.get("name"),
                "languages": m.get("languages"),
                "category": m.get("category")
            }
            for m in raw_models[:50]
        ]
    }


def print_human(summary: Dict[str, Any]):
    counts = summary["counts"]
    print("\n=== ElevenLabs Summary ===")
    print(f"Elapsed: {summary['elapsed_ms']} ms  Total Voices: {counts['total']}")
    cap = summary['capacity_inference']
    print(f"Cloned={counts['cloned']} Premade={counts['premade']} Other={counts['other']}")
    print(f"Heuristic first feasible cap: {cap['first_feasible_cap']} (current={cap['current_cloned_count']})")


def main(argv: List[str]) -> int:
    """Modo simplificado: siempre devuelve JSON con nombres de voces clonadas.

    Salida:
    {
      "cloned_voice_names": [...],
      "over_10_excess_count": <int>,
      "total_cloned": <int>
    }
    """
    api_key = _get_api_key()
    data = fetch_json(VOICES_ENDPOINT, api_key)
    if data.get('error'):
        print(json.dumps({'error': True, 'detail': data}, ensure_ascii=False))
        return 1
    voices = data.get('voices') or data.get('voices_list') or []
    cloned_names: List[str] = []
    for v in voices:
        if not isinstance(v, dict):
            continue
        if classify_voice(v) == 'cloned':
            name = v.get('name') or v.get('voice_id') or 'unknown'
            cloned_names.append(name)
    over_10 = max(0, len(cloned_names) - 10)
    output = {
        'cloned_voice_names': cloned_names,
        'over_10_excess_count': over_10,
        'total_cloned': len(cloned_names)
    }
    print(json.dumps(output, ensure_ascii=False, indent=2))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
