#!/bin/bash
set -e

# FastAPI runs on an internal port — only reachable from within this container.
# SvelteKit runs on $PORT — the only port Railway exposes publicly.
# SvelteKit's hooks.server.js proxies all /api/* requests to FastAPI.

INTERNAL_API_PORT="${INTERNAL_API_PORT:-8001}"

echo "→ Starting FastAPI on internal port ${INTERNAL_API_PORT}"
cd backend
uvicorn main:app --host 127.0.0.1 --port "$INTERNAL_API_PORT" &

echo "→ Starting SvelteKit on PORT=${PORT}"
cd ../frontend

# Set ORIGIN for SvelteKit CSRF protection (use Railway's public domain if available)
if [ -n "$RAILWAY_PUBLIC_DOMAIN" ] && [ -z "$ORIGIN" ]; then
  export ORIGIN="https://${RAILWAY_PUBLIC_DOMAIN}"
fi

exec node build
