import asyncio
import base64
import time
import uuid
from datetime import datetime
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from auth import require_admin
from crypto import decrypt, encrypt
from db import get_pool
from validate_url import validate_oracle_instance_url

router = APIRouter()


# ── Pydantic schemas ─────────────────────────────────────────────────────────

class ConnectionIn(BaseModel):
    connection_name: str
    username: str
    password: str
    instance_url: str


class ConnectionUpdate(BaseModel):
    connection_name: str
    username: str
    instance_url: str
    password: Optional[str] = None  # omit to keep existing password


class ConnectionOut(BaseModel):
    id: uuid.UUID
    connection_name: str
    username: str
    instance_url: str
    status: str
    last_tested_at: Optional[datetime]
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── SSRF-safe Oracle connection probe ────────────────────────────────────────

async def _probe_oracle(instance_url: str, username: str, password: str) -> dict:
    """
    SSRF mitigations:
      • URL is re-validated even if saved earlier (defence-in-depth)
      • follow_redirects=False — 3xx cannot escape to a private IP
      • 12-second hard timeout via httpx timeout
    """
    valid, error = await validate_oracle_instance_url(instance_url)
    if not valid:
        return {"success": False, "message": f"Blocked: {error}", "latency_ms": 0}

    base = instance_url.rstrip("/")
    test_url = f"{base}/fscmRestApi/resources/latest"
    credentials = base64.b64encode(f"{username}:{password}".encode()).decode()

    start = time.monotonic()
    try:
        async with httpx.AsyncClient(follow_redirects=False, timeout=12.0) as client:
            resp = await client.get(
                test_url,
                headers={"Authorization": f"Basic {credentials}", "Accept": "application/json"},
            )
        latency_ms = int((time.monotonic() - start) * 1000)

        if 300 <= resp.status_code < 400:
            return {"success": False, "message": "Server returned unexpected redirect — not confirmed", "latency_ms": latency_ms}
        if resp.is_success:
            return {"success": True, "message": "Connection successful", "latency_ms": latency_ms}
        if resp.status_code == 401:
            return {"success": False, "message": "Authentication failed — check username and password", "latency_ms": latency_ms}
        if resp.status_code == 403:
            return {"success": False, "message": "Access forbidden — user lacks REST API permission", "latency_ms": latency_ms}
        return {"success": False, "message": f"Server responded with {resp.status_code} {resp.reason_phrase}", "latency_ms": latency_ms}

    except httpx.TimeoutException:
        return {"success": False, "message": "Connection timed out after 12 seconds", "latency_ms": int((time.monotonic() - start) * 1000)}
    except httpx.ConnectError as exc:
        return {"success": False, "message": f"Cannot connect to instance: {exc}", "latency_ms": int((time.monotonic() - start) * 1000)}
    except Exception as exc:
        return {"success": False, "message": f"Network error: {exc}", "latency_ms": int((time.monotonic() - start) * 1000)}


# ── Helper ────────────────────────────────────────────────────────────────────

def _row(record) -> dict:
    """asyncpg Record → plain dict (str keys)."""
    return dict(record)


# ── GET /api/connections ──────────────────────────────────────────────────────

@router.get("", response_model=list[ConnectionOut])
async def list_connections(_user_id: str = Depends(require_admin)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT id, connection_name, username, instance_url,
                   status, last_tested_at, error_message, created_at, updated_at
            FROM oracle_saas_connections
            ORDER BY created_at DESC
        """)
    return [ConnectionOut.model_validate(_row(r)) for r in rows]


# ── POST /api/connections ─────────────────────────────────────────────────────

@router.post("/", response_model=ConnectionOut, status_code=status.HTTP_201_CREATED)
async def create_connection(body: ConnectionIn, _user_id: str = Depends(require_admin)):
    valid, error = await validate_oracle_instance_url(body.instance_url)
    if not valid:
        raise HTTPException(status_code=422, detail=error)

    pool = await get_pool()
    async with pool.acquire() as conn:
        try:
            row = await conn.fetchrow("""
                INSERT INTO oracle_saas_connections
                    (connection_name, username, password_enc, instance_url)
                VALUES ($1, $2, $3, $4)
                RETURNING id, connection_name, username, instance_url,
                          status, last_tested_at, error_message, created_at, updated_at
            """, body.connection_name, body.username, encrypt(body.password), body.instance_url)
        except Exception as exc:
            if "unique" in str(exc).lower():
                raise HTTPException(
                    status_code=409,
                    detail=f'A connection named "{body.connection_name}" already exists',
                )
            raise HTTPException(status_code=500, detail=str(exc))

    return ConnectionOut.model_validate(_row(row))


# ── PUT /api/connections/{id} ─────────────────────────────────────────────────

@router.put("/{conn_id}", response_model=ConnectionOut)
async def update_connection(
    conn_id: uuid.UUID, body: ConnectionUpdate, _user_id: str = Depends(require_admin)
):
    valid, error = await validate_oracle_instance_url(body.instance_url)
    if not valid:
        raise HTTPException(status_code=422, detail=error)

    pool = await get_pool()
    async with pool.acquire() as conn:
        try:
            if body.password:
                row = await conn.fetchrow("""
                    UPDATE oracle_saas_connections
                    SET connection_name = $1,
                        username        = $2,
                        password_enc    = $3,
                        instance_url    = $4,
                        status          = 'untested',
                        last_tested_at  = NULL,
                        error_message   = NULL
                    WHERE id = $5
                    RETURNING id, connection_name, username, instance_url,
                              status, last_tested_at, error_message, created_at, updated_at
                """, body.connection_name, body.username, encrypt(body.password), body.instance_url, conn_id)
            else:
                row = await conn.fetchrow("""
                    UPDATE oracle_saas_connections
                    SET connection_name = $1,
                        username        = $2,
                        instance_url    = $3
                    WHERE id = $4
                    RETURNING id, connection_name, username, instance_url,
                              status, last_tested_at, error_message, created_at, updated_at
                """, body.connection_name, body.username, body.instance_url, conn_id)
        except Exception as exc:
            if "unique" in str(exc).lower():
                raise HTTPException(
                    status_code=409,
                    detail=f'A connection named "{body.connection_name}" already exists',
                )
            raise HTTPException(status_code=500, detail=str(exc))

    if row is None:
        raise HTTPException(status_code=404, detail="Connection not found")
    return ConnectionOut.model_validate(_row(row))


# ── DELETE /api/connections/{id} ──────────────────────────────────────────────

@router.delete("/{conn_id}")
async def delete_connection(conn_id: uuid.UUID, _user_id: str = Depends(require_admin)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "DELETE FROM oracle_saas_connections WHERE id = $1 RETURNING id", conn_id
        )
    if row is None:
        raise HTTPException(status_code=404, detail="Connection not found")
    return {"deleted": True}


# ── POST /api/connections/test-all ───────────────────────────────────────────

@router.post("/test-all")
async def test_all_connections(_user_id: str = Depends(require_admin)):
    """Tests every stored connection in parallel, updates their status, and returns results."""
    pool = await get_pool()
    async with pool.acquire() as db:
        rows = await db.fetch("""
            SELECT id, connection_name, username, password_enc, instance_url
            FROM oracle_saas_connections
            ORDER BY created_at ASC
        """)

    if not rows:
        return []

    async def _test_one(record):
        try:
            password = decrypt(record["password_enc"])
        except Exception as exc:
            result = {"success": False, "message": f"Decryption error: {exc}", "latency_ms": 0}
        else:
            result = await _probe_oracle(record["instance_url"], record["username"], password)

        db_status = "success" if result["success"] else "failed"
        async with pool.acquire() as db:
            await db.execute("""
                UPDATE oracle_saas_connections
                SET status = $1, last_tested_at = NOW(), error_message = $2
                WHERE id = $3
            """, db_status, None if result["success"] else result["message"], record["id"])

        return {
            "id": str(record["id"]),
            "connection_name": record["connection_name"],
            "instance_url": record["instance_url"],
            "success": result["success"],
            "message": result["message"],
            "latency_ms": result["latency_ms"],
        }

    results = await asyncio.gather(*[_test_one(r) for r in rows])
    return list(results)


# ── POST /api/connections/{id}/test ───────────────────────────────────────────

@router.post("/{conn_id}/test")
async def test_connection(conn_id: uuid.UUID, _user_id: str = Depends(require_admin)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        record = await conn.fetchrow(
            "SELECT id, username, password_enc, instance_url FROM oracle_saas_connections WHERE id = $1",
            conn_id,
        )
        if record is None:
            raise HTTPException(status_code=404, detail="Connection not found")

        password = decrypt(record["password_enc"])
        result = await _probe_oracle(record["instance_url"], record["username"], password)

        db_status = "success" if result["success"] else "failed"
        updated = await conn.fetchrow("""
            UPDATE oracle_saas_connections
            SET status         = $1,
                last_tested_at = NOW(),
                error_message  = $2
            WHERE id = $3
            RETURNING id, connection_name, username, instance_url,
                      status, last_tested_at, error_message, created_at, updated_at
        """, db_status, None if result["success"] else result["message"], conn_id)

    return {**result, "connection": ConnectionOut.model_validate(_row(updated)).model_dump()}
