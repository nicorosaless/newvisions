#!/usr/bin/env python3
"""Generador de códigos de activación.

Crea 150 códigos de activación nuevos en la base de datos `voicememos_db` (colección `activation_codes`).

Requisitos del código:
- Longitud exacta: 11 caracteres
- Solo alfanumérico (A-Z a-z 0-9)
- Debe contener al menos UNA letra y al menos UN dígito
- Formato "parecido" a ejemplos: A345j853Sr2 (mezcla de mayúsculas/minúsculas y números)

El script:
1. Conecta usando la variable de entorno MONGO_URI (.env)
2. Asegura índice único en `code`
3. Genera códigos evitando colisiones con los existentes
4. Inserta documentos con estructura básica: {
       code, used=False, used_at=None, used_by=None,
       used_for_password_reset=False, password_reset_at=None, password_reset_by=None
   }
5. Imprime un resumen al final.

Uso:
    python generate_activation_codes.py            # genera 150 nuevos (o los que falten)
    CODES=50 python generate_activation_codes.py   # genera 50 en lugar de 150

Idempotencia: si ya existen N códigos únicos previos creados por este script (o en general), se añaden únicamente los faltantes hasta llegar a la cuenta deseada adicional.
"""
from __future__ import annotations

import os
import sys
import random
import string
from datetime import datetime
from typing import Set

from dotenv import load_dotenv
from pymongo import MongoClient, ASCENDING
from pymongo.errors import DuplicateKeyError

DEFAULT_TARGET = 150
LETTERS = string.ascii_letters
DIGITS = string.digits
ALPHANUM = LETTERS + DIGITS
CODE_LENGTH = 11


def load_client() -> MongoClient:
    load_dotenv()
    uri = os.getenv("MONGO_URI")
    if not uri:
        print("❌ MONGO_URI no encontrado en el entorno (.env)")
        sys.exit(1)
    return MongoClient(uri)


def get_db(client: MongoClient):
    # Nombre documentado
    return client["voicememos_db"]


def is_valid(code: str) -> bool:
    if len(code) != CODE_LENGTH:
        return False
    if not all(c in ALPHANUM for c in code):
        return False
    has_letter = any(c.isalpha() for c in code)
    has_digit = any(c.isdigit() for c in code)
    return has_letter and has_digit


def generate_code(rng: random.Random) -> str:
    # Estrategia: garantizar al menos 1 letra y 1 dígito; resto aleatorio.
    letters_needed = 1
    digits_needed = 1
    remaining = CODE_LENGTH - letters_needed - digits_needed
    parts = [
        rng.choice(LETTERS),
        rng.choice(DIGITS),
        *[rng.choice(ALPHANUM) for _ in range(remaining)],
    ]
    rng.shuffle(parts)
    code = "".join(parts)
    # Pequeña heurística: asegurar que no sea demasiado homogéneo (opcional)
    return code


def gather_existing_codes(collection) -> Set[str]:
    return {doc["code"] for doc in collection.find({}, {"code": 1})}


def ensure_index(collection):
    collection.create_index([("code", ASCENDING)], unique=True)


def main():
    target = int(os.getenv("CODES", str(DEFAULT_TARGET)))
    rng = random.Random()

    client = load_client()
    db = get_db(client)
    col = db["activation_codes"]

    ensure_index(col)
    existing = gather_existing_codes(col)
    print(f"📊 Códigos existentes: {len(existing)}")

    to_insert = []
    attempts = 0
    needed = target
    print(f"🎯 Objetivo generar: {needed} códigos nuevos")

    while len(to_insert) < needed:
        attempts += 1
        if attempts > needed * 50:
            print("⚠️ Demasiados intentos, posible espacio saturado; abortando.")
            break
        code = generate_code(rng)
        if code in existing or any(d["code"] == code for d in to_insert):
            continue
        if not is_valid(code):
            continue
        doc = {
            "code": code,
            "used": False,
            "used_at": None,
            "used_by": None,
            "used_for_password_reset": False,
            "password_reset_at": None,
            "password_reset_by": None,
            "created_at": datetime.utcnow(),
        }
        to_insert.append(doc)

    inserted = 0
    if to_insert:
        try:
            result = col.insert_many(to_insert, ordered=False)
            inserted = len(result.inserted_ids)
        except DuplicateKeyError:
            # En caso improbable de colisión concurrente, insertar uno a uno
            print("⚠️ Colisiones detectadas en inserción masiva; reintentando individualmente.")
            inserted = 0
            for doc in to_insert:
                try:
                    col.insert_one(doc)
                    inserted += 1
                except DuplicateKeyError:
                    pass

    total_after = col.count_documents({})

    print("\n===== RESUMEN =====")
    print(f"Generados solicitados: {target}")
    print(f"Insertados realmente: {inserted}")
    print(f"Total en colección tras operación: {total_after}")
    if inserted:
        sample = [d["code"] for d in to_insert[:10]]
        print("Ejemplos:", ", ".join(sample))
    print("===================")

    client.close()


if __name__ == "__main__":
    main()
