#!/usr/bin/env bash
# Minimal backend runner (no args) - always reload on source changes.
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"
if [[ -f .venv/bin/activate ]]; then
  source .venv/bin/activate
fi
export PYTHONPATH="$ROOT_DIR"
PORT=5002
echo "🚀 Backend on http://localhost:$PORT (auto-reload)"
exec uvicorn backend.main:get_app --factory --host 0.0.0.0 --port $PORT --reload --reload-dir backend
