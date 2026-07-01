# Edit File Parser Dialog

## Problem

`frontend/src/routes/mytools/parser/+page.svelte` lists saved file parsers (name, file, type, column count, created date) with New/Delete actions fully wired up. The Edit action (`+page.svelte:243`) is a disabled placeholder button (`title="Edit (coming soon)"`). The backend already has a complete `PUT /api/parsers/{id}` endpoint (`backend/routers/parsers.py:316-349`) validated against a `ParserUpdate` schema (`name`, `parse_type`, `delimiter_char`, `has_header`, `columns` — no file/extension fields, since the underlying file can't be replaced) — it has simply never been wired up from the UI.

## Design

### 1. Enable the Edit button

In `frontend/src/routes/mytools/parser/+page.svelte`, remove `disabled` and the "(coming soon)" title from the edit button at line 243, and wire its `onclick` to open a new edit dialog, passing the clicked row's full parser record:

```js
let editingParser = $state(/** @type {any|null} */ (null));
```

```svelte
<button class="action-btn edit-btn" title="Edit" onclick={() => { editingParser = parser; }}>
	{#if EditIcon}<EditIcon size={12} />{/if} Edit
</button>
```

### 2. New component: `EditFileParserDialog.svelte`

Lives alongside the existing dialog: `frontend/src/lib/components/FileParser/EditFileParserDialog.svelte`, exported from `frontend/src/lib/components/FileParser/index.js` next to `NewFileParserDialog`.

Unlike `NewFileParserDialog` (2-step wizard: upload → layout), this is a single-step dialog — there is no file to (re-)upload, so there is no stepper. Props: `{ parser, onSave, onClose }` where `parser` is the full row object from the parsers list (matching the backend's `ParserOut` shape: `id`, `name`, `original_filename`, `file_extension`, `parse_type`, `delimiter_char`, `has_header`, `columns`).

Local state is seeded once from `parser` on mount (not kept in sync afterward — the dialog owns its own edit buffer, same pattern `NewFileParserDialog` already uses for `step1`/`step2`):

```js
let name       = $state(parser.name);
let parseType  = $state(parser.parse_type);
let hasHeader  = $state(parser.has_header ?? true);
/** @type {{ parseType, delimiterChar, customDelimiter, hasHeader, columns }} */
let layout     = $state({
	parseType:     parser.parse_type,
	delimiterChar: parser.delimiter_char ?? ',',
	customDelimiter: '',
	hasHeader:     parser.has_header ?? true,
	columns:       parser.columns.map(c => ({ ...c })),
});
```

Body content, top to bottom:
- Read-only file info line: extension badge + `parser.original_filename` (same visual treatment as the table's `.ext-badge`), no clear/change control — communicates which file this parser is bound to without implying it's editable.
- Name field — same input styling as `Step1Upload`'s name field.
- File-type toggle (Delimited / Fixed Length) — shown **only when** `parser.file_extension === 'txt'` (csv/xls/xlsx parsers never show this, mirroring `Step1Upload`'s rule that non-txt files are always `delimited`). Switching it resets `layout.columns` to `[]`, since delimited columns (`position`) and fixed-length columns (`start_pos`/`length`/`trim`) are incompatible shapes — the user re-adds columns for the new shape via the column editor below.
- First-Line-Has-Headers Yes/No toggle — same toggle styling as `Step1Upload`, but purely a stored flag here (no file to re-scan, so toggling it never re-triggers column auto-detection).
- `Step2Layout` component, reused unmodified, bound to `layout` — this already renders the delimiter picker (only when not fixed-length) and the full column editor (add/remove/edit name, position or start_pos+length+trim, data type). No changes needed to `Step2Layout.svelte` itself; it's already a pure `{value, onchange}` component with no upload-specific coupling.

Validation mirrors `NewFileParserDialog`'s `step2Valid`: `name` non-blank and `layout.columns.length > 0` with every column's `name` non-blank.

### 3. Save wiring

On Save, build the `ParserUpdate` payload and `PUT` it:

```js
const payload = {
	name: name.trim(),
	parse_type: parseType,
	delimiter_char: parseType === 'fixed_length' ? null : (layout.delimiterChar === '__custom__' ? layout.customDelimiter || ',' : layout.delimiterChar),
	has_header: parseType === 'fixed_length' ? null : hasHeader,
	columns: layout.columns.map((c, idx) => ({
		name: c.name.trim(),
		data_type: c.data_type,
		position:  parseType === 'delimited'    ? idx + 1 : undefined,
		start_pos: parseType === 'fixed_length' ? c.start_pos : undefined,
		length:    parseType === 'fixed_length' ? c.length    : undefined,
		trim:      parseType === 'fixed_length' ? (c.trim ?? true) : undefined,
	})),
};
```

This exactly mirrors the payload-shaping logic already in `NewFileParserDialog.handleSave` (`NewFileParserDialog.svelte:118-142`), reused for consistency since both feed the same backend validation.

In `+page.svelte`, a new `updateParser(id, payload)` function calls `PUT /api/parsers/{id}` via the existing `apiFetch` helper, mirroring `saveParser`/`deleteParser`'s existing error handling:

```js
async function updateParser(id, payload) {
	const res  = await apiFetch(`${API}/api/parsers/${id}`, {
		method: 'PUT',
		body: JSON.stringify(payload),
	}, auth);
	const data = await res.json();
	if (!res.ok) throw new Error(data.detail ?? data.error ?? `Server error ${res.status}`);
	parsers = parsers.map(p => p.id === id ? data : p);
	editingParser = null;
	showToast('Parser updated');
}
```

On failure, the dialog shows the error inline (same `error` state / `.error-msg` pattern `NewFileParserDialog` already uses) rather than closing, so the user's edits aren't lost.

## Out of scope

- No changes to `Step2Layout.svelte` or `Step1Upload.svelte`.
- No ability to replace the underlying file or change `original_filename`/`file_extension` — matches the backend's `ParserUpdate` schema, which doesn't accept them.
- No re-running header auto-detection during edit (there is no file available to re-read).

## Testing

- Component test for `EditFileParserDialog.svelte`: renders pre-filled with a sample parser's name/columns; edits a column name and asserts the save payload reflects the change; asserts the txt-only parse-type toggle is absent for a `csv` parser fixture and present for a `txt` one; asserts switching parse type on a `txt` fixture clears `columns`.
- Update `frontend/src/routes/mytools/parser/+page.svelte`'s existing behavior (no dedicated test file currently exists for this route — check before assuming one needs to be created vs. extended) to cover: clicking Edit opens the dialog with the row's data, and a successful save replaces that row in the table and shows the "Parser updated" toast.
- Manual check in the browser: edit a delimited parser's columns and save; edit a `.txt` fixed-length parser, switch it to Delimited, confirm columns reset and re-add compiles into a valid delimited payload; trigger a save error (e.g. duplicate name) and confirm the dialog stays open with the error shown.
