import csv as _csv
import io as _io
import json
import logging
import uuid
from datetime import datetime
from typing import Any, Literal, Optional

import asyncpg
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel, field_validator, model_validator

from auth import require_admin
from db import get_pool

log = logging.getLogger(__name__)
router = APIRouter()

_VALID_DATA_TYPES = frozenset({"String", "Integer", "Decimal", "Date", "Timestamp", "Boolean"})
_MAX_NAME_LEN = 120
_MAX_COLUMNS = 200


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class ColumnDef(BaseModel):
    name: str
    data_type: str
    position: Optional[int] = None
    start_pos: Optional[int] = None
    length: Optional[int] = None
    trim: Optional[bool] = True

    @field_validator("name")
    @classmethod
    def name_nonempty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Column name cannot be blank")
        return v

    @field_validator("data_type")
    @classmethod
    def valid_data_type(cls, v: str) -> str:
        if v not in _VALID_DATA_TYPES:
            raise ValueError(f"data_type must be one of {sorted(_VALID_DATA_TYPES)}")
        return v

    @field_validator("start_pos", "length")
    @classmethod
    def positive_int(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 1:
            raise ValueError("start_pos and length must be ≥ 1")
        return v


def _check_columns(
    parse_type: str,
    delimiter_char: Optional[str],
    columns: list[ColumnDef],
    file_extension: str = "",
) -> None:
    """Shared cross-field validation called from both ParserIn and ParserUpdate."""
    if not columns:
        raise ValueError("At least one column is required")
    if len(columns) > _MAX_COLUMNS:
        raise ValueError(f"Cannot define more than {_MAX_COLUMNS} columns")

    names = [c.name for c in columns]
    if len(names) != len(set(names)):
        raise ValueError("Column names must be unique within a parser")

    is_excel = file_extension in ("xls", "xlsx")
    if parse_type == "delimited":
        if not is_excel and not delimiter_char:
            raise ValueError("delimiter_char is required for delimited parsers")
    else:
        for col in columns:
            if col.start_pos is None or col.length is None:
                raise ValueError(
                    f'Column "{col.name}": start_pos and length are required for fixed-length parsers'
                )


class ParserIn(BaseModel):
    name: str
    original_filename: str
    file_extension: Literal["csv", "txt", "xls", "xlsx"]
    parse_type: Literal["fixed_length", "delimited"]
    delimiter_char: Optional[str] = None
    has_header: Optional[bool] = None
    columns: list[ColumnDef] = []

    @field_validator("name")
    @classmethod
    def name_clean(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Parser name cannot be blank")
        if len(v) > _MAX_NAME_LEN:
            raise ValueError(f"Parser name must be ≤ {_MAX_NAME_LEN} characters")
        return v

    @field_validator("delimiter_char")
    @classmethod
    def single_char(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) != 1:
            raise ValueError("delimiter_char must be exactly one character")
        return v

    @model_validator(mode="after")
    def cross_field(self) -> "ParserIn":
        _check_columns(self.parse_type, self.delimiter_char, self.columns, self.file_extension)
        return self


class ParserUpdate(BaseModel):
    name: str
    parse_type: Literal["fixed_length", "delimited"]
    delimiter_char: Optional[str] = None
    has_header: Optional[bool] = None
    columns: list[ColumnDef] = []

    @field_validator("name")
    @classmethod
    def name_clean(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Parser name cannot be blank")
        if len(v) > _MAX_NAME_LEN:
            raise ValueError(f"Parser name must be ≤ {_MAX_NAME_LEN} characters")
        return v

    @field_validator("delimiter_char")
    @classmethod
    def single_char(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) != 1:
            raise ValueError("delimiter_char must be exactly one character")
        return v

    @model_validator(mode="after")
    def cross_field(self) -> "ParserUpdate":
        _check_columns(self.parse_type, self.delimiter_char, self.columns)
        return self


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


# ── Helpers ───────────────────────────────────────────────────────────────────

def _row(record) -> dict:
    """Convert asyncpg Record to dict, safely deserializing the columns JSONB field."""
    d = dict(record)
    raw = d.get("columns")
    if isinstance(raw, str):
        try:
            d["columns"] = json.loads(raw)
        except (json.JSONDecodeError, ValueError):
            log.error("Corrupt columns JSON for parser id=%s — falling back to []", d.get("id"))
            d["columns"] = []
    elif raw is None:
        d["columns"] = []
    # already a list (native asyncpg jsonb decode) — pass through
    return d


_SELECT = """
    SELECT id, name, original_filename, file_extension, parse_type,
           delimiter_char, has_header, columns, status, created_at, updated_at
    FROM file_parsers
"""


# ── POST /api/parsers/parse-headers ──────────────────────────────────────────

@router.post("/parse-headers")
async def parse_file_headers(
    file: UploadFile = File(...),
    has_header: str = Form("true"),
    parse_type: str = Form("delimited"),
    delimiter_char: Optional[str] = Form(None),
    _user_id: str = Depends(require_admin),
):
    """Read the first row of an uploaded file and return column names."""
    if has_header.lower() != "true":
        return {"columns": [], "detected_delimiter": None}

    filename = file.filename or ""
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large for header preview (max 5 MB)")

    columns: list[dict] = []
    detected_delimiter: Optional[str] = None

    if ext == "xlsx":
        import openpyxl  # noqa: PLC0415
        wb = openpyxl.load_workbook(_io.BytesIO(contents), read_only=True, data_only=True)
        ws = wb.active
        first_row = next(ws.iter_rows(min_row=1, max_row=1, values_only=True), None)
        wb.close()
        if first_row:
            columns = [
                {"name": str(v).strip(), "position": i}
                for i, v in enumerate(first_row, start=1)
                if v is not None and str(v).strip()
            ]

    elif ext == "xls":
        import xlrd  # noqa: PLC0415
        wb = xlrd.open_workbook(file_contents=contents)
        ws = wb.sheet_by_index(0)
        if ws.nrows > 0:
            columns = [
                {"name": str(v).strip(), "position": i}
                for i, v in enumerate(ws.row_values(0), start=1)
                if v is not None and str(v).strip()
            ]

    elif ext in ("csv", "txt"):
        text = contents.decode("utf-8-sig", errors="replace")
        delim = delimiter_char
        if not delim:
            try:
                dialect = _csv.Sniffer().sniff(text[:4096], delimiters=",\t|;")
                delim = dialect.delimiter
                detected_delimiter = delim
            except _csv.Error:
                delim = ","
        reader = _csv.reader(_io.StringIO(text), delimiter=delim)
        first_row_vals = next(reader, [])
        columns = [
            {"name": name.strip(), "position": i}
            for i, name in enumerate(first_row_vals, start=1)
            if name.strip()
        ]

    else:
        raise HTTPException(status_code=422, detail=f"Unsupported file type: .{ext}")

    return {"columns": columns, "detected_delimiter": detected_delimiter}


# ── GET /api/parsers ──────────────────────────────────────────────────────────

@router.get("", response_model=list[ParserOut])
async def list_parsers(_user_id: str = Depends(require_admin)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(_SELECT + "ORDER BY created_at DESC")
    return [ParserOut.model_validate(_row(r)) for r in rows]


# ── GET /api/parsers/{id} ─────────────────────────────────────────────────────

@router.get("/{parser_id}", response_model=ParserOut)
async def get_parser(parser_id: uuid.UUID, _user_id: str = Depends(require_admin)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(_SELECT + "WHERE id = $1", parser_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Parser not found")
    return ParserOut.model_validate(_row(row))


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
        except asyncpg.UniqueViolationError:
            raise HTTPException(status_code=409, detail=f'A parser named "{body.name}" already exists')
        except asyncpg.PostgresError as exc:
            log.error("DB error creating parser name=%r: %s", body.name, exc)
            raise HTTPException(status_code=500, detail="Database error — parser not created")

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
        except asyncpg.UniqueViolationError:
            raise HTTPException(status_code=409, detail=f'A parser named "{body.name}" already exists')
        except asyncpg.PostgresError as exc:
            log.error("DB error updating parser id=%s: %s", parser_id, exc)
            raise HTTPException(status_code=500, detail="Database error — parser not updated")

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
