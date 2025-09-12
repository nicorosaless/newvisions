#!/usr/bin/env python3
"""
Detailed MongoDB Schema Analyzer
Analyzes the structure and fields of MongoDB collections.
"""

import os
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from datetime import datetime
import json


def analyze_collection_structure(collection, collection_name, sample_size=10):
    """Analyze the structure of a MongoDB collection."""
    print(f"\n🔍 Analyzing collection: {collection_name}")
    print("=" * 60)

    # Get total count
    total_docs = collection.count_documents({})
    print(f"📊 Total documents: {total_docs}")

    # Sample documents for analysis
    sample_docs = list(collection.find().limit(sample_size))

    if not sample_docs:
        print("⚠️  No documents found in collection")
        return {}

    # Analyze field structure
    field_analysis = {}

    for doc in sample_docs:
        for field, value in doc.items():
            if field not in field_analysis:
                field_analysis[field] = {
                    'types': set(),
                    'sample_values': [],
                    'nullable': False,
                    'count': 0
                }

            # Track types
            field_analysis[field]['types'].add(type(value).__name__)

            # Track sample values (limit to avoid huge output)
            if len(field_analysis[field]['sample_values']) < 3:
                if isinstance(value, (str, int, float, bool)):
                    field_analysis[field]['sample_values'].append(value)
                elif isinstance(value, datetime):
                    field_analysis[field]['sample_values'].append(value.isoformat())
                elif isinstance(value, dict):
                    field_analysis[field]['sample_values'].append(f"dict with {len(value)} keys")
                elif isinstance(value, list):
                    field_analysis[field]['sample_values'].append(f"list with {len(value)} items")
                else:
                    field_analysis[field]['sample_values'].append(str(type(value).__name__))

            field_analysis[field]['count'] += 1

    # Check for nullability by looking at all documents
    all_docs = list(collection.find().limit(100))  # Check more docs for nullability
    for field in field_analysis:
        field_present = sum(1 for doc in all_docs if field in doc)
        field_analysis[field]['presence_percentage'] = (field_present / len(all_docs)) * 100
        field_analysis[field]['nullable'] = field_present < len(all_docs)

    return field_analysis


def generate_field_description(field_name, analysis):
    """Generate a human-readable description of a field."""
    types = list(analysis['types'])
    type_str = types[0] if len(types) == 1 else f"{' | '.join(types)}"

    description = f"- **{field_name}**: `{type_str}`"

    if analysis['nullable']:
        description += " (nullable)"

    presence = analysis['presence_percentage']
    if presence < 100:
        description += f" ({presence:.1f}% presence)"

    if analysis['sample_values']:
        samples = analysis['sample_values'][:2]  # Show max 2 samples
        sample_str = ", ".join(f"`{str(s)}`" for s in samples)
        if len(analysis['sample_values']) > 2:
            sample_str += "..."
        description += f" - Examples: {sample_str}"

    return description


def main():
    """Main function to analyze MongoDB collections."""
    # Load environment variables
    load_dotenv()

    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        print("❌ MONGO_URI not found in environment variables")
        return

    try:
        # Connect to MongoDB
        print("🔌 Connecting to MongoDB...")
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        print("✅ Successfully connected to MongoDB")

        # Get database
        db_names = client.list_database_names()
        if 'voicememos_db' in db_names:
            db = client['voicememos_db']
            db_name = 'voicememos_db'
            print(f"📊 Using database: voicememos_db")
        elif db_names:
            db = client[db_names[0]]
            db_name = db_names[0]
            print(f"📊 Using database: {db_names[0]}")
        else:
            print("❌ No databases found")
            return

        # Get collections
        collections = db.list_collection_names()
        print(f"📁 Collections: {collections}")

        # Analyze each collection
        collection_analyses = {}
        for collection_name in collections:
            collection = db[collection_name]
            analysis = analyze_collection_structure(collection, collection_name)
            collection_analyses[collection_name] = analysis

        # Generate documentation
        generate_documentation(db_name, collections, collection_analyses)

        client.close()

    except Exception as e:
        print(f"❌ Error: {e}")


def generate_documentation(db_name, collections, analyses):
    """Generate markdown documentation for the database schema."""

    doc_content = f"""# Database Description - {db_name}

## 📊 Database Overview

- **Database Name**: `{db_name}`
- **Collections**: {len(collections)}
- **Analysis Date**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## 📋 Collections Schema

"""

    for collection_name in collections:
        analysis = analyses[collection_name]
        doc_content += f"### 🎯 Collection: `{collection_name}`\n\n"

        if analysis:
            doc_content += "**Fields:**\n\n"
            for field_name in sorted(analysis.keys()):
                field_desc = generate_field_description(field_name, analysis[field_name])
                doc_content += f"{field_desc}\n"
        else:
            doc_content += "*No documents found for analysis*\n"

        doc_content += "\n---\n\n"

    # Save to file
    os.makedirs('docs', exist_ok=True)
    with open('docs/database_description.md', 'w', encoding='utf-8') as f:
        f.write(doc_content)

    print("\n✅ Documentation generated: docs/database_description.md")
    print(f"📁 File saved at: {os.path.abspath('docs/database_description.md')}")


if __name__ == "__main__":
    main()