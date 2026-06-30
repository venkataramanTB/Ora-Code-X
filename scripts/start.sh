#!/bin/bash
set -e

INTERNAL_API_PORT="${INTERNAL_API_PORT:-8001}"

echo "→ Starting FastAPI on internal port ${INTERNAL_API_PORT}"
cd backend

uvicorn main:app \
  --host 0.0.0.0 \
  --port "${INTERNAL_API_PORT}" &

echo "→ Starting SvelteKit on PORT=${PORT}"

cd ../frontend

if [ -n "$RAILWAY_PUBLIC_DOMAIN" ] && [ -z "$ORIGIN" ]; then
    export ORIGIN="https://${RAILWAY_PUBLIC_DOMAIN}"
fi

export HOST="0.0.0.0"
export PORT="${PORT:-8080}"
export NODE_ENV="production"

echo "→ HOST=${HOST}"
echo "→ PORT=${PORT}"

exec node build