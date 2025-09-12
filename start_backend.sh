#!/usr/bin/env zsh
# Start FastAPI server on port 5002. Optional live reload only for local code.

set -euo pipefail

SCRIPT_DIR=$(cd -- "${0:a:h}" && pwd)
PROJECT_ROOT=$(cd -- "$SCRIPT_DIR/.." && pwd)
cd "$PROJECT_ROOT"

export PYTHONPATH="$PROJECT_ROOT"

# Toggle with DEV_RELOAD=1 (default 0). Restrict reload to backend dir only.
DEV_RELOAD=${DEV_RELOAD:-0}

UVICORN_CMD=(uvicorn backend.main:get_app --host 0.0.0.0 --port 5002 --factory)

if [[ "$DEV_RELOAD" == "1" ]]; then
	echo "[start] DEV_RELOAD active: watching only ./backend"
	UVICORN_CMD+=(--reload --reload-dir backend --reload-include '*.py' --reload-exclude '.venv/*' --reload-exclude '*/site-packages/*')
else
	echo "[start] Running without auto-reload (set DEV_RELOAD=1 to enable)"
fi

exec "${UVICORN_CMD[@]}"
