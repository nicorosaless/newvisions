#!/usr/bin/env python3
"""
Simple test script to verify the backend can start
"""
import sys
import os

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from backend.main import get_app
    app = get_app()
    print("✅ Backend application created successfully!")
    print(f"📋 App title: {app.title}")
    print(f"🔗 Routes: {len(app.routes)} routes found")
    print("🚀 Ready for deployment!")
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error creating app: {e}")
    sys.exit(1)
