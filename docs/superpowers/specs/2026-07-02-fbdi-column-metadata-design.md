# FBDI Template Column Metadata (Data Type / Length / Required)

## Problem

The FBDI Templates "Columns" detail view (`frontend/src/routes/mytools/templates/fbdi/+page.svelte`) shows Table (Sheet), Column Name, Position, and a raw Notes column. The user wants to see structured Data Type, Length, and Required(Y/N) columns instead — matching the layout of Oracle's own FBDI template documentation sheet (Table(Sheet) | Column Name | Position | Data Type | Length | Required(Y/N)).

Two problems block this today:

1. **Wrong notes source.** The backend's `_parse_workbook` (`backend/routers/fbdi.py:58-112`) currently reads "notes" from the row of cells immediately below the header row — a heuristic, not the actual Excel cell comment/note Oracle attaches to each header cell (the hover tooltip with the red corner marker, containing lines like `NOT NULL`, `VARCHAR2(50)`, and a description). Data Type and Length need to come from that real comment text, which isn't being read at all.
2. **Required(Y/N) isn't derivable from the comment.** In this user's FBDI templates, mandatory columns are marked by a leading `*` on the column header cell itself (e.g. the cell literally contains `*STATUS_CODE`), not by a "NOT NULL" phrase in the comment. The current header-detection regex (`_ORACLE_RE = r'^[A-Z][A-Z0-9_]{1,59}$'`) doesn't match `*`-prefixed values, so mandatory columns risk being silently dropped during parsing today.

## Design

### 1. Backend: read real cell comments, not read-only mode

`openpyxl` does not expose `cell.comment` when a workbook is opened with `read_only=True` (a documented limitation — comments are simply not loaded in streaming/read-only mode). `_parse_workbook` currently opens with `read_only=True`. This changes to `read_only=False`, keeping `data_only=True`. Given the existing 20 MB upload cap (`backend/routers/fbdi.py:158-159`), the extra memory cost of full (non-streaming) parsing is acceptable.

### 2. Backend: header detection tolerates a leading `*`

`_ORACLE_RE` and `_is_oracle_row` currently require the value to start with a letter. A header cell may now literally read `*STATUS_CODE`. Detection strips a single leading `*` (and surrounding whitespace) before matching against the existing `^[A-Z][A-Z0-9_]{1,59}$` pattern, so `*`-prefixed mandatory columns are recognized as valid Oracle headers instead of being skipped.

### 3. Backend: per-column extraction changes

For each header cell in the detected header row:

- **`required`**: `True` if the raw cell value (before stripping) starts with `*`, else `False`.
- **`column_name`**: the raw cell value with a leading `*` and surrounding whitespace stripped. (The asterisk is fully consumed into `required` — it never appears in the stored/displayed column name.)
- **`notes`**: the header cell's actual Excel comment text (`cell.comment.text` if a comment exists, else `None`). The old "row below header" heuristic is removed entirely — no other code reads `notes_row` anymore.
- **`data_type` / `length`**: parsed from the comment text (independent of `required`, which now comes only from the `*` prefix). Match the comment text against a fixed list of Oracle types — `VARCHAR2, NVARCHAR2, NUMBER, DATE, CHAR, NCHAR, TIMESTAMP, CLOB, RAW, INTEGER, FLOAT, LONG, BLOB` — case-insensitively, optionally followed by a parenthesized `(n)` or `(n,m)`. First match wins. `data_type` is the matched keyword, uppercased; `length` is the captured parenthesized content verbatim (e.g. `"50"`, `"10,2"`) or `None` if the type has no parenthesized suffix (e.g. bare `DATE`). If no known type is found anywhere in the comment, both are `None`.

Example: comment text `"STATUS\nNOT NULL\nVARCHAR2(50)\n\nJournal Import Status..."` → `data_type="VARCHAR2"`, `length="50"`. (Note: the comment may still contain the literal words "NOT NULL" as descriptive text — that text is no longer used for anything; `required` comes exclusively from the `*` prefix on the column name.)

### 4. Database

`fbdi_columns` gains three columns, added via the same idempotent DDL-on-request pattern already used for table creation (`backend/routers/fbdi.py:20-43`):

```sql
ALTER TABLE fbdi_columns ADD COLUMN IF NOT EXISTS data_type TEXT;
ALTER TABLE fbdi_columns ADD COLUMN IF NOT EXISTS length    TEXT;
ALTER TABLE fbdi_columns ADD COLUMN IF NOT EXISTS required  BOOLEAN NOT NULL DEFAULT false;
```

The `/upload` INSERT and both SELECT queries (`list_templates`'s detail path is per-template only, so just `get_template` and the post-insert re-select in `upload_fbdi`) are updated to write/read these three columns. `ColumnOut` gains `data_type: Optional[str]`, `length: Optional[str]`, `required: bool`.

**Existing templates**: rows already in the database were parsed with the old row-heuristic notes and don't have `*`-aware column names. They keep `data_type=NULL`, `length=NULL`, `required=false` until re-uploaded — no backfill migration. This was confirmed acceptable.

### 5. Frontend

In the Columns detail table (`frontend/src/routes/mytools/templates/fbdi/+page.svelte:418-446`), the column set changes from `sheet_name, column_name, position, notes` to `sheet_name, column_name, position, data_type, length, required` — six sortable columns total, matching: Table (Sheet) | Column Name | Position | Data Type | Length | Required(Y/N). Notes is no longer displayed anywhere on this page.

- `data_type` / `length`: render the value, or `—` when `null` (matching the existing empty-value convention already used for notes: `{col.notes ?? '—'}`).
- `required`: render `Y` when `true`, `N` when `false` (never blank — this is always a concrete boolean from the DB).
- Column search (`colFiltered`, `+page.svelte:92-101`) keeps matching `column_name` and `sheet_name`, and additionally matches `data_type`; it stops matching `notes` since that field is no longer surfaced in this view.

## Out of scope

- No backfill/re-parse of templates already in the database — re-upload is the stated path to get the new fields populated.
- No change to the Templates list grid (top-level grid showing template name/file/sheet count/column count) — only the per-template Columns detail table changes.
- No UI for viewing the raw notes/comment text anymore (it's dropped from display, though still stored and returned by the API for potential future use).
- No change to the upload dialog (`frontend/src/lib/components/FBDI/UploadDialog.svelte`) or the file-size/type validation already in place.

## Testing

- Backend: unit test the type/length regex against representative comment strings (`"VARCHAR2(50)"` → `("VARCHAR2", "50")`; `"NUMBER(10,2)"` → `("NUMBER", "10,2")`; bare `"DATE"` → `("DATE", None)`; comment with no recognizable type → `(None, None)`).
- Backend: unit test the `*`-prefix stripping and `required` detection against sample header values (`"*STATUS_CODE"` → `column_name="STATUS_CODE", required=True`; `"STATUS_CODE"` → `required=False`).
- Backend: integration test `/api/fbdi/upload` with a small in-memory `.xlsx` built via `openpyxl` (write mode) containing a header row with one `*`-prefixed and one plain column, each with a `Comment` object attached, asserting the returned `TemplateDetailOut.columns` have the correct `data_type`/`length`/`required`/`column_name`/`notes`.
- Frontend: component/rendering check that the detail table renders the six-column header set and that `required` renders as `Y`/`N` and null `data_type`/`length` render as `—`.
- Manual: upload a real FBDI file with `*`-prefixed mandatory columns and Excel cell comments, confirm the Columns table shows correct Data Type/Length/Required values matching the source file.
