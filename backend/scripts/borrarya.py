#!/usr/bin/env python3
"""Elimina las N últimas voces clonadas (LRU) de ElevenLabs.

Uso:
  python borrarya.py         # elimina 2 últimas por defecto (prompt)
  python borrarya.py --count 3 --force   # elimina 3 últimas sin pedir confirmación
  python borrarya.py --dry-run            # muestra las voces que se eliminarían

Requisitos:
  - Variable de entorno ELEVEN_LABS_API_KEY
  - requests instalado
"""
from __future__ import annotations
import os
import sys
import json
import argparse
from typing import Any, Dict, List
import requests
from dotenv import load_dotenv  # type: ignore

load_dotenv()
API_BASE = "https://api.elevenlabs.io"
VOICES_ENDPOINT = f"{API_BASE}/v1/voices"
DELETE_ENDPOINT_TMPL = f"{API_BASE}/v1/voices/{{voice_id}}"


def get_api_key() -> str:
    key = os.getenv("ELEVEN_LABS_API_KEY")
    if not key:
        print(json.dumps({"error": True, "message": "Falta ELEVEN_LABS_API_KEY"}, ensure_ascii=False))
        sys.exit(1)
    return key


def fetch_voices(api_key: str) -> List[Dict[str, Any]]:
    r = requests.get(VOICES_ENDPOINT, headers={"xi-api-key": api_key}, timeout=30)
    try:
        r.raise_for_status()
    except Exception:
        raise RuntimeError(f"Error listando voces: {r.status_code} {r.text[:200]}")
    data = r.json()
    voices = data.get("voices") or data.get("voices_list") or []
    return [v for v in voices if isinstance(v, dict)]


def classify_voice(v: Dict[str, Any]) -> str:
    category = (v.get("category") or v.get("voice_category") or "").lower()
    if "clone" in category:
        return "cloned"
    if category in {"generated", "custom", "user"}:
        return "cloned"
    if category in {"premade", "professional", "classic"}:
        return "premade"
    return "other"


def delete_voice(api_key: str, voice_id: str) -> Dict[str, Any]:
    url = DELETE_ENDPOINT_TMPL.format(voice_id=voice_id)
    r = requests.delete(url, headers={"xi-api-key": api_key}, timeout=30)
    if r.status_code >= 400:
        return {"error": True, "status_code": r.status_code, "body": safe_body(r)}
    try:
        return r.json()
    except Exception:
        return {"status_code": r.status_code, "text": r.text[:500]}


def safe_body(r: requests.Response) -> Any:
    try:
        return r.json()
    except Exception:
        return r.text[:500]


def main(argv: List[str]) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--count', type=int, default=2, help='Número de últimas voces LRU a eliminar (por defecto 2)')
    parser.add_argument('--force', action='store_true', help='No pedir confirmación')
    parser.add_argument('--dry-run', action='store_true', help='No borrar, solo mostrar lo que se haría')
    parser.add_argument('--list', action='store_true', help='Listar voces clonadas y salir')
    args = parser.parse_args(argv)

    api_key = get_api_key()
    try:
        voices = fetch_voices(api_key)
    except Exception as e:
        print(json.dumps({"error": True, "message": str(e)}, ensure_ascii=False))
        return 1

    cloned = [v for v in voices if classify_voice(v) == 'cloned']
    if args.list:
        output = {
            "cloned_total": len(cloned),
            "cloned_names": [v.get('name') for v in cloned],
        }
        print(json.dumps(output, ensure_ascii=False, indent=2))
        return 0

    if not cloned:
        print(json.dumps({"error": True, "message": "No hay voces clonadas para eliminar"}, ensure_ascii=False))
        return 1

    # Por orden LRU asumimos que la API devuelve en orden y las últimas son las menos usadas
    count = max(1, args.count)
    targets = cloned[-count:]

    summary = [{"voice_id": t.get('voice_id'), "name": t.get('name')} for t in targets]

    print(json.dumps({"to_delete_count": len(targets), "targets": summary}, ensure_ascii=False, indent=2))

    if args.dry_run:
        print(json.dumps({"dry_run": True}, ensure_ascii=False))
        return 0

    if not args.force:
        confirm = input(f"Confirmar borrado de {len(targets)} voces clonadas listadas arriba? [y/N]: ").strip().lower()
        if confirm not in {'y', 'yes'}:
            print(json.dumps({"aborted": True}, ensure_ascii=False))
            return 0

    results = []
    for t in targets:
        vid = t.get('voice_id')
        vname = t.get('name')
        if not isinstance(vid, str) or not vid:
            results.append({"error": True, "message": "voice_id inválido", "item": t})
            continue
        res = delete_voice(api_key, vid)
        results.append({"voice_id": vid, "name": vname, "provider_response": res})

    print(json.dumps({"deleted_total": len([r for r in results if not r.get('provider_response', {}).get('error')]), "results": results}, ensure_ascii=False, indent=2))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
