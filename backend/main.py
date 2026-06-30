from contextlib import asynccontextmanager
import os

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db import close_pool, init_db
from routers.connections import router as connections_router
from routers.parsers import router as parsers_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_pool()


app = FastAPI(
    title="OraCodeX Backend",
    version="1.0.0",
    lifespan=lifespan,
    redirect_slashes=False,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    allow_credentials=True,
)


@app.get("/health")
async def health():
    return {"status": "ok"}


app.include_router(connections_router, prefix="/api/connections")
app.include_router(parsers_router, prefix="/api/parsers")
