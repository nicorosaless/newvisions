#!/usr/bin/env bash
# Minimal frontend runner (no args) - binds to vite default port 5173.
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
API_URL="http://localhost:5002"
PORT=5173
cd "$FRONTEND_DIR"
echo "📦 Installing dependencies (if needed)..."
npm install --no-audit --no-fund

export VITE_API_BASE_URL="$API_URL"
echo "🌐 Frontend (npm run dev) expecting port $PORT (API=$API_URL)"
exec npm run dev -- --port $PORT --host
