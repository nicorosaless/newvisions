#!/usr/bin/env python3
"""Elimina una voz clonada de ElevenLabs por ID o por nombre.

Uso:
  python delete_voice.py --id VOICE_ID
  python delete_voice.py --name "Nombre Voz" (case-insensitive)

Flags:
  --force   Omite confirmación interactiva.
  --list    Solo lista las voces clonadas y sale (ignora otros argumentos).

Requisitos:
  - Variable de entorno ELEVEN_LABS_API_KEY
  - requests instalado

Salida:
  JSON con resultado o error.
"""
from __future__ import annotations
import os
import sys
import json
import argparse
from typing import Any, Dict, List, Optional
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


def resolve_voice_id(voices: List[Dict[str, Any]], voice_id: Optional[str], name: Optional[str]) -> Dict[str, Any]:
    if voice_id:
        for v in voices:
            if v.get("voice_id") == voice_id:
                return v
        raise ValueError(f"No se encontró voz con id={voice_id}")
    if name:
        target = name.lower().strip()
        matches = [v for v in voices if (v.get("name") or "").lower() == target]
        if not matches:
            # Búsqueda contiene
            contains = [v for v in voices if target in (v.get("name") or "").lower()]
            if len(contains) == 1:
                return contains[0]
            if len(contains) > 1:
                raise ValueError(f"Coincidencias múltiples para '{name}': {[c.get('name') for c in contains]}")
            raise ValueError(f"No se encontró voz con nombre='{name}'")
        if len(matches) > 1:
            raise ValueError(f"Multiples coincidencias exactas para '{name}': {[m.get('voice_id') for m in matches]}")
        return matches[0]
    raise ValueError("Debe proporcionar --id o --name")


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
    parser.add_argument('--id', dest='voice_id')
    parser.add_argument('--name')
    parser.add_argument('--force', action='store_true')
    parser.add_argument('--list', action='store_true', help='Lista voces clonadas y sale')
    parser.add_argument('--delete-last', action='store_true', help='Elimina la última voz clonada (orden según API)')
    args = parser.parse_args(argv)

    api_key = get_api_key()
    try:
        voices = fetch_voices(api_key)
    except Exception as e:
        print(json.dumps({"error": True, "message": str(e)}, ensure_ascii=False))
        return 1

    if args.list:
        cloned = [v for v in voices if classify_voice(v) == 'cloned']
        output = {
            "cloned_total": len(cloned),
            "cloned_names": [v.get('name') for v in cloned],
            "over_10_excess_count": max(0, len(cloned) - 10)
        }
        print(json.dumps(output, ensure_ascii=False, indent=2))
        return 0

    if args.delete_last:
        cloned = [v for v in voices if classify_voice(v) == 'cloned']
        if not cloned:
            print(json.dumps({"error": True, "message": "No hay voces clonadas para eliminar"}, ensure_ascii=False))
            return 1
        target = cloned[-1]
        vid = target.get('voice_id')
        vname = target.get('name')
        if not args.force:
            confirm = input(f"Confirmar borrado de ÚLTIMA voz clonada '{vname}' (id={vid})? [y/N]: ").strip().lower()
            if confirm not in {'y','yes'}:
                print(json.dumps({"aborted": True, "voice_id": vid, "name": vname}, ensure_ascii=False))
                return 0
        if not isinstance(vid, str) or not vid:
            print(json.dumps({"error": True, "message": "voice_id inválido en última voz"}, ensure_ascii=False))
            return 1
        result = delete_voice(api_key, vid)
        if result.get('error'):
            print(json.dumps({"error": True, "message": "Fallo al eliminar última", "detail": result}, ensure_ascii=False))
            return 1
        print(json.dumps({"deleted": True, "last": True, "voice_id": vid, "name": vname, "provider_response": result}, ensure_ascii=False, indent=2))
        return 0

    try:
        target = resolve_voice_id(voices, args.voice_id, args.name)
    except Exception as e:
        print(json.dumps({"error": True, "message": str(e)}, ensure_ascii=False))
        return 1

    vid = target.get('voice_id')
    if not isinstance(vid, str) or not vid:
        print(json.dumps({"error": True, "message": "La voz seleccionada no tiene voice_id válido"}, ensure_ascii=False))
        return 1
    vname = target.get('name')
    classification = classify_voice(target)
    if classification != 'cloned':
        print(json.dumps({"error": True, "message": f"La voz '{vname}' no es 'cloned' (class={classification})"}, ensure_ascii=False))
        return 1

    if not args.force:
        confirm = input(f"Confirmar borrado de voz clonada '{vname}' (id={vid})? [y/N]: ").strip().lower()
        if confirm not in {'y','yes'}:
            print(json.dumps({"aborted": True, "voice_id": vid, "name": vname}, ensure_ascii=False))
            return 0

    result = delete_voice(api_key, vid)
    if result.get('error'):
        print(json.dumps({"error": True, "message": "Fallo al eliminar", "detail": result}, ensure_ascii=False))
        return 1

    print(json.dumps({"deleted": True, "voice_id": vid, "name": vname, "provider_response": result}, ensure_ascii=False, indent=2))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
