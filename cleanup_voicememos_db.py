#!/usr/bin/env python3
"""Cleanup script for voicememos_db

Actions:
1. Connect to MongoDB using MONGO_URI from .env
2. Clean `users` collection leaving exactly ONE example user following docs/database_description.md
3. Validate `activation_codes` collection and remove any documents whose `code` field:
   - Is missing
   - Is not a string
   - Does not match the regex ^[A-Za-z0-9]{11}$
   - Does NOT contain at least one letter AND one number (must be alphanumeric mix)
4. Print a summary report of actions performed.

The example user adheres to the documented schema:
- username, email unique
- password stored as bcrypt hash (bytes in DB)
- created_at UTC
- settings with required fields (language, voice_similarity, stability, add_background_sound, background_volume, sex, OS)
- Optional fields set to initial sensible values (voice_clone_id=None, charCount=0, recordedVoice=None)

Safety:
- Does NOT drop database; only mutates the target collections.
"""
from __future__ import annotations

import os
import sys
import re
from datetime import datetime, timezone
from typing import Any, Dict

import bcrypt
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.errors import PyMongoError

# Constants
CODE_REGEX = re.compile(r"^[A-Za-z0-9]{11}$")


def load_mongo_uri() -> str:
    load_dotenv()
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        print("❌ MONGO_URI no encontrado en variables de entorno (.env)")
        sys.exit(1)
    return mongo_uri


def get_db(client: MongoClient):
    # If database name is embedded in URI pymongo selects it when using client.get_default_database()
    # We expect the logical name from documentation: voicememos_db
    # Fallback to 'voicememos_db'
    # Try to infer from URI path
    uri_db_name = None
    try:
        # naive parse
        after_slash = client.address  # not reliable for SRV
    except Exception:
        pass
    # Use canonical name per docs
    return client["voicememos_db"]


def hash_password(password: str) -> bytes:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt)


def rebuild_users(collection: Collection) -> Dict[str, Any]:
    print("🧹 Limpiando colección 'users' ...")
    deleted = collection.delete_many({})
    print(f"   🗑️  Eliminados {deleted.deleted_count} documentos previos")

    example_user = {
        "username": "exampleUser",
        "email": "example@voicememos.app",
        # bcrypt hash stored as bytes
        "password": hash_password("examplePassword123"),
        "created_at": datetime.now(timezone.utc),
        "voice_clone_id": None,
        "charCount": 0,
        "recordedVoice": None,
        "settings": {
            "language": "english",
            "voice_similarity": 0.85,
            "stability": 0.7,
            "add_background_sound": True,
            "background_volume": 0.5,
            "sex": "male",
            "OS": "ios",
        },
    }

    insert_result = collection.insert_one(example_user)
    print(f"✅ Usuario de ejemplo insertado con _id={insert_result.inserted_id}")
    return {"deleted_users": deleted.deleted_count, "inserted_user_id": str(insert_result.inserted_id)}


def validate_code(code: Any) -> bool:
    if not isinstance(code, str):
        return False
    if not CODE_REGEX.match(code):
        return False
    # Must contain at least one letter and one digit
    has_letter = any(c.isalpha() for c in code)
    has_digit = any(c.isdigit() for c in code)
    return has_letter and has_digit


def clean_activation_codes(collection: Collection) -> Dict[str, Any]:
    print("🔍 Validando colección 'activation_codes' ...")
    total_before = collection.count_documents({})

    invalid_ids = []
    valid_count = 0
    cursor = collection.find({}, {"code": 1})
    for doc in cursor:
        code = doc.get("code")
        if validate_code(code):
            valid_count += 1
        else:
            invalid_ids.append(doc["_id"])

    removed_count = 0
    if invalid_ids:
        print(f"   🧪 Encontrados {len(invalid_ids)} códigos inválidos: eliminando...")
        result = collection.delete_many({"_id": {"$in": invalid_ids}})
        removed_count = result.deleted_count
    else:
        print("   ✅ Todos los códigos existentes son válidos")

    total_after = collection.count_documents({})
    print(
        f"📊 activation_codes -> total_antes={total_before}, validos={valid_count}, removidos={removed_count}, total_despues={total_after}"
    )
    return {
        "total_before": total_before,
        "valid_codes": valid_count,
        "removed_invalid": removed_count,
        "total_after": total_after,
    }


def ensure_indexes(users: Collection, activation_codes: Collection):
    print("⚙️  Asegurando índices recomendados ...")
    # Users indexes
    users.create_index("username", unique=True)
    users.create_index("email", unique=True)
    users.create_index("voice_clone_id")
    users.create_index("settings.sex")
    users.create_index("settings.OS")
    # Activation codes indexes
    activation_codes.create_index("code", unique=True)
    activation_codes.create_index("used")
    activation_codes.create_index("used_at")


def main():
    mongo_uri = load_mongo_uri()
    print("🔌 Conectando a MongoDB ...")
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=8000, tlsAllowInvalidCertificates=True)
    try:
        client.admin.command("ping")
    except Exception as e:
        print(f"❌ No se pudo conectar/ping MongoDB: {e}")
        sys.exit(1)
    print("✅ Conexión exitosa")

    db = get_db(client)
    users_col = db["users"]
    activation_col = db["activation_codes"]

    results_users = rebuild_users(users_col)
    results_activation = clean_activation_codes(activation_col)
    ensure_indexes(users_col, activation_col)

    print("\n===== RESUMEN =====")
    print(f"Usuarios eliminados: {results_users['deleted_users']}")
    print(f"Usuario ejemplo _id: {results_users['inserted_user_id']}")
    print(
        "Activation codes - antes: {total_before}, validos: {valid_codes}, removidos: {removed_invalid}, despues: {total_after}".format(
            **results_activation
        )
    )
    print("===================")

    client.close()


if __name__ == "__main__":
    main()
