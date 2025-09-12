#!/usr/bin/env python3
"""
MongoDB Database Reader Script
Tests connection to MongoDB and reads data from collections.
"""

import os
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError


def test_mongo_connection():
    """Test MongoDB connection and read data from collections."""
    # Load environment variables
    load_dotenv()

    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        print("❌ MONGO_URI not found in environment variables")
        return False

    try:
        # Connect to MongoDB
        print("🔌 Connecting to MongoDB...")
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)

        # Test the connection
        client.admin.command('ping')
        print("✅ Successfully connected to MongoDB")

        # List available databases
        db_names = client.list_database_names()
        print(f"📊 Available databases: {db_names}")

        if not db_names:
            print("⚠️  No databases found in this MongoDB instance")
            client.close()
            return True

        # Use the first available database for demonstration
        db_name = db_names[0]
        db = client[db_name]
        print(f"📊 Using database: {db_name}")

        # List collections
        collections = db.list_collection_names()
        print(f"📁 Collections in {db_name}: {collections}")

        # Read data from each collection
        for collection_name in collections:
            collection = db[collection_name]
            doc_count = collection.count_documents({})
            print(f"\n📄 Collection '{collection_name}': {doc_count} documents")

            if doc_count > 0:
                # Show first 3 documents as preview
                print("📋 Sample documents:")
                for doc in collection.find().limit(3):
                    # Convert ObjectId to string for readability
                    doc_display = {k: str(v) if k == '_id' else v for k, v in doc.items()}
                    print(f"  {doc_display}")

                if doc_count > 3:
                    print(f"  ... and {doc_count - 3} more documents")
            else:
                print("  (empty collection)")

        client.close()
        return True

    except ServerSelectionTimeoutError:
        print("❌ Connection timeout - check your MongoDB URI and network connection")
        return False
    except ConnectionFailure as e:
        print(f"❌ Connection failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False


if __name__ == "__main__":
    print("🧪 Testing MongoDB connection and data reading...\n")
    success = test_mongo_connection()
    if success:
        print("\n✅ MongoDB test completed successfully!")
    else:
        print("\n❌ MongoDB test failed!")
        exit(1)