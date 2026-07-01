import json
import uuid
from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from auth import require_admin
from db import get_pool

router = APIRouter()


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class ColumnDef(BaseModel):
    name: str
    data_type: str                    # String | Integer | Decimal | Date | Timestamp | Boolean
    # delimited only
    position: Optional[int] = None
    # fixed-length only
    start_pos: Optional[int] = None
    length: Optional[int] = None
    trim: Optional[bool] = True


class ParserIn(BaseModel):
    name: str
    original_filename: str
    file_extension: str               # 'csv' | 'txt'
    parse_type: str                   # 'fixed_length' | 'delimited'
    delimiter_char: Optional[str] = None
    has_header: Optional[bool] = None
    columns: list[ColumnDef] = []


class ParserUpdate(BaseModel):
    name: str
    parse_type: str
    delimiter_char: Optional[str] = None
    has_header: Optional[bool] = None
    columns: list[ColumnDef] = []


class ParserOut(BaseModel):
    id: uuid.UUID
    name: str
    original_filename: str
    file_extension: str
    parse_type: str
    delimiter_char: Optional[str]
    has_header: Optional[bool]
    columns: list[dict[str, Any]]
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


def _row(record) -> dict:
    d = dict(record)
    if isinstance(d.get('columns'), str):
        d['columns'] = json.loads(d['columns'])
    return d


# ── GET /api/parsers ──────────────────────────────────────────────────────────

@router.get("", response_model=list[ParserOut])
async def list_parsers(_user_id: str = Depends(require_admin)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT id, name, original_filename, file_extension, parse_type,
                   delimiter_char, has_header, columns, status, created_at, updated_at
            FROM file_parsers
            ORDER BY created_at DESC
        """)
    return [ParserOut.model_validate(_row(r)) for r in rows]


# ── POST /api/parsers ─────────────────────────────────────────────────────────

@router.post("", response_model=ParserOut, status_code=status.HTTP_201_CREATED)
async def create_parser(body: ParserIn, _user_id: str = Depends(require_admin)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        try:
            row = await conn.fetchrow("""
                INSERT INTO file_parsers
                    (name, original_filename, file_extension, parse_type,
                     delimiter_char, has_header, columns)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id, name, original_filename, file_extension, parse_type,
                          delimiter_char, has_header, columns, status, created_at, updated_at
            """,
                body.name,
                body.original_filename,
                body.file_extension,
                body.parse_type,
                body.delimiter_char,
                body.has_header,
                json.dumps([c.model_dump() for c in body.columns]),
            )
        except Exception as exc:
            if "unique" in str(exc).lower():
                raise HTTPException(
                    status_code=409,
                    detail=f'A parser named "{body.name}" already exists',
                )
            raise HTTPException(status_code=500, detail=str(exc))

    return ParserOut.model_validate(_row(row))


# ── PUT /api/parsers/{id} ─────────────────────────────────────────────────────

@router.put("/{parser_id}", response_model=ParserOut)
async def update_parser(
    parser_id: uuid.UUID, body: ParserUpdate, _user_id: str = Depends(require_admin)
):
    pool = await get_pool()
    async with pool.acquire() as conn:
        try:
            row = await conn.fetchrow("""
                UPDATE file_parsers
                SET name           = $1,
                    parse_type     = $2,
                    delimiter_char = $3,
                    has_header     = $4,
                    columns        = $5
                WHERE id = $6
                RETURNING id, name, original_filename, file_extension, parse_type,
                          delimiter_char, has_header, columns, status, created_at, updated_at
            """,
                body.name,
                body.parse_type,
                body.delimiter_char,
                body.has_header,
                json.dumps([c.model_dump() for c in body.columns]),
                parser_id,
            )
        except Exception as exc:
            if "unique" in str(exc).lower():
                raise HTTPException(
                    status_code=409,
                    detail=f'A parser named "{body.name}" already exists',
                )
            raise HTTPException(status_code=500, detail=str(exc))

    if row is None:
        raise HTTPException(status_code=404, detail="Parser not found")
    return ParserOut.model_validate(_row(row))


# ── DELETE /api/parsers/{id} ──────────────────────────────────────────────────

@router.delete("/{parser_id}")
async def delete_parser(parser_id: uuid.UUID, _user_id: str = Depends(require_admin)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "DELETE FROM file_parsers WHERE id = $1 RETURNING id", parser_id
        )
    if row is None:
        raise HTTPException(status_code=404, detail="Parser not found")
    return {"deleted": True}
