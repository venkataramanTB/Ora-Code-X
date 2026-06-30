FROM node:22-slim

# Python for FastAPI backend (Debian bookworm: python3 = 3.11)
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 python3-pip \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python deps (cached unless requirements.txt changes)
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip3 install --break-system-packages -r backend/requirements.txt

# Node deps (cached unless package-lock.json changes)
COPY frontend/package.json frontend/package-lock.json frontend/.npmrc ./frontend/
RUN cd frontend && npm ci

# Build-time env vars for Vite (Railway injects these as build args)
ARG VITE_API_URL=""
ARG PUBLIC_CLERK_PUBLISHABLE_KEY=""

# Build SvelteKit
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# Backend source + startup script
COPY backend/ ./backend/
COPY scripts/ ./scripts/
RUN chmod +x scripts/start.sh

CMD ["bash", "scripts/start.sh"]
