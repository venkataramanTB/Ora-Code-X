<script>
	import { onMount } from 'svelte';
	import { useClerkContext } from 'svelte-clerk';
	import { ICON_MAP } from '$lib/data/icons.js';
	import { apiFetch, apiUpload } from '$lib/api.js';
	import UploadDialog from '$lib/components/FBDI/UploadDialog.svelte';

	const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
	const { session, clerk } = useClerkContext();
	const auth = { session, signOut: () => clerk?.signOut() ?? Promise.resolve() };

	const UploadIcon   = ICON_MAP['Upload'];
	const TableIcon    = ICON_MAP['Database'];
	const TrashIcon    = ICON_MAP['Trash2'];
	const ChevronIcon  = ICON_MAP['ChevronDown'];
	const SearchIcon   = ICON_MAP['Search'];
	const CloseIcon    = ICON_MAP['X'];
	const FileIcon     = ICON_MAP['FileSpreadsheet'];

	// ── State ──────────────────────────────────────────────────────────────────
	/** @type {any[]} */
	let templates   = $state([]);
	let loading     = $state(true);
	let fetchError  = $state('');
	let dialogOpen  = $state(false);
	let deletingId  = $state(/** @type {string|null} */ (null));

	/** @type {any|null} */
	let selectedTpl = $state(null);
	/** @type {any[]|null} */
	let detailCols  = $state(null);
	let detailLoading = $state(false);
	let detailSheet = $state('');

	// ── Toast ──────────────────────────────────────────────────────────────────
	/** @type {{ text: string, type: 'success'|'error' }|null} */
	let toast = $state(null);
	let _toastTimer = /** @type {ReturnType<typeof setTimeout>|null} */ (null);

	/** @param {string} text @param {'success'|'error'} [type] */
	function showToast(text, type = 'success') {
		if (_toastTimer) clearTimeout(_toastTimer);
		toast = { text, type };
		_toastTimer = setTimeout(() => { toast = null; }, 4200);
	}

	// ── Templates grid state ───────────────────────────────────────────────────
	let tplSearch   = $state('');
	let tplSortCol  = $state('created_at');
	let tplSortDir  = $state(/** @type {'asc'|'desc'} */ ('desc'));
	let tplPage     = $state(1);
	const TPL_PAGE_SIZE = 10;

	const tplFiltered = $derived(
		templates.filter(t =>
			!tplSearch ||
			t.name.toLowerCase().includes(tplSearch.toLowerCase()) ||
			t.original_filename.toLowerCase().includes(tplSearch.toLowerCase())
		)
	);

	const tplSorted = $derived([...tplFiltered].sort((a, b) => {
		const va = a[tplSortCol] ?? '';
		const vb = b[tplSortCol] ?? '';
		const cmp = typeof va === 'number'
			? va - vb
			: String(va).localeCompare(String(vb));
		return tplSortDir === 'asc' ? cmp : -cmp;
	}));

	const tplPageCount = $derived(Math.max(1, Math.ceil(tplSorted.length / TPL_PAGE_SIZE)));
	const tplRows = $derived(tplSorted.slice((tplPage - 1) * TPL_PAGE_SIZE, tplPage * TPL_PAGE_SIZE));

	/** @param {string} col */
	function tplSort(col) {
		if (tplSortCol === col) {
			tplSortDir = tplSortDir === 'asc' ? 'desc' : 'asc';
		} else {
			tplSortCol = col;
			tplSortDir = 'asc';
		}
		tplPage = 1;
	}

	// ── Columns detail grid state ──────────────────────────────────────────────
	let colSearch   = $state('');
	let colSortCol  = $state('position');
	let colSortDir  = $state(/** @type {'asc'|'desc'} */ ('asc'));
	let colPage     = $state(1);
	const COL_PAGE_SIZE = 20;

	const colFiltered = $derived(
		(detailCols ?? []).filter(c => {
			const sheetMatch = !detailSheet || c.sheet_name === detailSheet;
			const searchMatch = !colSearch ||
				c.column_name.toLowerCase().includes(colSearch.toLowerCase()) ||
				(c.sheet_name ?? '').toLowerCase().includes(colSearch.toLowerCase()) ||
				(c.notes ?? '').toLowerCase().includes(colSearch.toLowerCase());
			return sheetMatch && searchMatch;
		})
	);

	const colSorted = $derived([...colFiltered].sort((a, b) => {
		const va = a[colSortCol] ?? '';
		const vb = b[colSortCol] ?? '';
		const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
		return colSortDir === 'asc' ? cmp : -cmp;
	}));

	const colPageCount = $derived(Math.max(1, Math.ceil(colSorted.length / COL_PAGE_SIZE)));
	const colRows = $derived(colSorted.slice((colPage - 1) * COL_PAGE_SIZE, colPage * COL_PAGE_SIZE));

	/** @param {string} col */
	function colSort(col) {
		if (colSortCol === col) {
			colSortDir = colSortDir === 'asc' ? 'desc' : 'asc';
		} else {
			colSortCol = col;
			colSortDir = 'asc';
		}
		colPage = 1;
	}

	const colSheets = $derived([...new Set((detailCols ?? []).map(c => c.sheet_name))].sort());

	// ── Stats ──────────────────────────────────────────────────────────────────
	const stats = $derived({
		total:   templates.length,
		sheets:  templates.reduce((s, t) => s + (t.sheet_count ?? 0), 0),
		columns: templates.reduce((s, t) => s + (t.column_count ?? 0), 0),
	});

	// ── API ────────────────────────────────────────────────────────────────────
	async function loadTemplates() {
		loading = true; fetchError = '';
		try {
			const res = await apiFetch(`${API}/api/fbdi`, {}, auth);
			if (!res.ok) throw new Error(`Server error ${res.status}`);
			templates = await res.json();
		} catch (err) {
			fetchError = /** @type {Error} */ (err).message;
		} finally {
			loading = false;
		}
	}

	/**
	 * @param {string} name
	 * @param {File} file
	 */
	async function handleUpload(name, file) {
		const fd = new FormData();
		fd.append('name', name);
		fd.append('file', file);

		const res = await apiUpload(`${API}/api/fbdi/upload`, fd, auth);
		const data = await res.json();
		if (!res.ok) throw new Error(data.detail ?? `Server error ${res.status}`);

		templates = [{ ...data, columns: undefined }, ...templates];
		dialogOpen = false;
		showToast(`"${data.name}" uploaded — ${data.sheet_count} table(s), ${data.column_count} columns`);
	}

	/** @param {any} tpl */
	async function viewTemplate(tpl) {
		if (selectedTpl?.id === tpl.id) {
			selectedTpl = null;
			detailCols = null;
			return;
		}
		selectedTpl = tpl;
		detailCols = null;
		detailSheet = '';
		colSearch = '';
		colPage = 1;
		detailLoading = true;
		try {
			const res = await apiFetch(`${API}/api/fbdi/${tpl.id}`, {}, auth);
			if (!res.ok) throw new Error(`Server error ${res.status}`);
			const data = await res.json();
			detailCols = data.columns ?? [];
		} catch (err) {
			showToast(/** @type {Error} */ (err).message, 'error');
			selectedTpl = null;
		} finally {
			detailLoading = false;
		}
	}

	/** @param {string} id */
	async function deleteTemplate(id) {
		deletingId = id;
		try {
			const res = await apiFetch(`${API}/api/fbdi/${id}`, { method: 'DELETE' }, auth);
			if (!res.ok) { const d = await res.json(); throw new Error(d.detail ?? 'Delete failed'); }
			templates = templates.filter(t => t.id !== id);
			if (selectedTpl?.id === id) { selectedTpl = null; detailCols = null; }
			showToast('Template deleted');
		} catch (err) {
			showToast(/** @type {Error} */ (err).message, 'error');
		} finally {
			deletingId = null;
		}
	}

	// ── Helpers ────────────────────────────────────────────────────────────────
	/** @param {string} iso */
	function fmtDate(iso) {
		return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
	}

	/** @param {string} col @param {string} active @param {'asc'|'desc'} dir */
	function sortIcon(col, active, dir) {
		if (col !== active) return '↕';
		return dir === 'asc' ? '↑' : '↓';
	}

	onMount(loadTemplates);
</script>

<svelte:head>
	<title>FBDI Templates · OraBridgeX Nexus</title>
</svelte:head>

<!-- Upload dialog -->
{#if dialogOpen}
	<UploadDialog onUpload={handleUpload} onClose={() => { dialogOpen = false; }} />
{/if}

<!-- Toast -->
{#if toast}
	<div class="toast" class:toast-error={toast.type === 'error'} role="status">
		{toast.text}
	</div>
{/if}

<div class="page">

	<!-- ── Header ──────────────────────────────────────────────────────── -->
	<div class="page-header">
		<div class="page-header-left">
			<span class="page-icon" aria-hidden="true">
				{#if FileIcon}<FileIcon size={28} strokeWidth={1.5} />{/if}
			</span>
			<div>
				<h1 class="page-title">FBDI Templates</h1>
				<p class="page-sub">Upload Oracle FBDI Excel files to extract and catalogue table columns</p>
			</div>
		</div>
		<button class="upload-btn" onclick={() => { dialogOpen = true; }}>
			{#if UploadIcon}<UploadIcon size={15} />{/if}
			Upload Template
		</button>
	</div>

	<!-- ── Stats ────────────────────────────────────────────────────────── -->
	<div class="stats-row">
		{#each [
			{ label: 'Templates', value: stats.total,   icon: 'FileSpreadsheet' },
			{ label: 'Tables',    value: stats.sheets,  icon: 'Database'        },
			{ label: 'Columns',   value: stats.columns, icon: 'Columns'         },
		] as s}
			<div class="stat-card neo-convex elev-1">
				<span class="stat-value">{s.value}</span>
				<span class="stat-label">{s.label}</span>
			</div>
		{/each}
	</div>

	<!-- ── Templates DataGrid ────────────────────────────────────────────── -->
	<div class="grid-card neo-convex elev-2">
		<div class="grid-toolbar">
			<div class="search-wrap">
				{#if SearchIcon}<span class="search-icon"><SearchIcon size={14} /></span>{/if}
				<input
					class="search-input"
					type="search"
					placeholder="Search templates…"
					bind:value={tplSearch}
					oninput={() => { tplPage = 1; }}
				/>
			</div>
			<span class="row-count">{tplFiltered.length} template{tplFiltered.length !== 1 ? 's' : ''}</span>
		</div>

		<div class="grid-wrap">
			{#if loading}
				<div class="grid-state"><span class="spinner-lg"></span><span>Loading…</span></div>
			{:else if fetchError}
				<div class="grid-state error-state">{fetchError}</div>
			{:else if tplSorted.length === 0}
				<div class="grid-state muted">
					{tplSearch ? 'No templates match your search.' : 'No FBDI templates yet — upload one to get started.'}
				</div>
			{:else}
				<table class="data-table">
					<thead>
						<tr>
							{#each [
								{ key: 'name',              label: 'Name'     },
								{ key: 'original_filename', label: 'File'     },
								{ key: 'sheet_count',       label: 'Tables'   },
								{ key: 'column_count',      label: 'Columns'  },
								{ key: 'created_at',        label: 'Uploaded' },
							] as col}
								<th class:active-col={tplSortCol === col.key}>
									<button class="th-btn" onclick={() => tplSort(col.key)}>
										{col.label}
										<span class="sort-icon">{sortIcon(col.key, tplSortCol, tplSortDir)}</span>
									</button>
								</th>
							{/each}
							<th class="th-actions">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each tplRows as tpl (tpl.id)}
							<tr
								class:selected={selectedTpl?.id === tpl.id}
								onclick={() => viewTemplate(tpl)}
							>
								<td class="td-name">{tpl.name}</td>
								<td class="td-file" title={tpl.original_filename}>{tpl.original_filename}</td>
								<td class="td-num">{tpl.sheet_count}</td>
								<td class="td-num">{tpl.column_count}</td>
								<td class="td-date">{fmtDate(tpl.created_at)}</td>
								<td class="td-actions" onclick={e => e.stopPropagation()}>
									<button
										class="action-btn view-btn"
										class:active={selectedTpl?.id === tpl.id}
										onclick={() => viewTemplate(tpl)}
										title="View columns"
									>
										{#if TableIcon}<TableIcon size={13} />{/if}
										Columns
									</button>
									<button
										class="action-btn del-btn"
										onclick={() => deleteTemplate(tpl.id)}
										disabled={deletingId === tpl.id}
										title="Delete template"
									>
										{#if deletingId === tpl.id}
											<span class="spinner-sm"></span>
										{:else if TrashIcon}
											<TrashIcon size={13} />
										{/if}
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</div>

		<!-- Pagination -->
		{#if tplPageCount > 1}
			<div class="pagination">
				<button class="pg-btn" disabled={tplPage === 1} onclick={() => tplPage--}>‹</button>
				{#each Array.from({ length: tplPageCount }, (_, i) => i + 1) as p}
					<button class="pg-btn" class:pg-active={tplPage === p} onclick={() => tplPage = p}>{p}</button>
				{/each}
				<button class="pg-btn" disabled={tplPage === tplPageCount} onclick={() => tplPage++}>›</button>
				<span class="pg-info">
					{(tplPage - 1) * TPL_PAGE_SIZE + 1}–{Math.min(tplPage * TPL_PAGE_SIZE, tplSorted.length)} of {tplSorted.length}
				</span>
			</div>
		{/if}
	</div>

	<!-- ── Column Detail Panel ───────────────────────────────────────────── -->
	{#if selectedTpl}
		<div class="detail-card neo-convex elev-2">
			<div class="detail-header">
				<div class="detail-header-left">
					{#if TableIcon}<span class="detail-icon"><TableIcon size={16} /></span>{/if}
					<div>
						<h2 class="detail-title">Columns — {selectedTpl.name}</h2>
						<p class="detail-sub">{selectedTpl.original_filename}</p>
					</div>
				</div>
				<div class="detail-controls">
					<!-- Sheet filter -->
					<div class="select-wrap">
						<select class="sheet-select" bind:value={detailSheet} onchange={() => { colPage = 1; }}>
							<option value="">All Tables ({colSheets.length})</option>
							{#each colSheets as sh}
								<option value={sh}>{sh}</option>
							{/each}
						</select>
						{#if ChevronIcon}<span class="select-arrow"><ChevronIcon size={12} /></span>{/if}
					</div>
					<!-- Column search -->
					<div class="search-wrap">
						{#if SearchIcon}<span class="search-icon"><SearchIcon size={13} /></span>{/if}
						<input
							class="search-input search-sm"
							type="search"
							placeholder="Filter columns…"
							bind:value={colSearch}
							oninput={() => { colPage = 1; }}
						/>
					</div>
					<button class="icon-close-btn" onclick={() => { selectedTpl = null; detailCols = null; }} aria-label="Close detail">
						{#if CloseIcon}<CloseIcon size={14} />{/if}
					</button>
				</div>
			</div>

			<div class="grid-wrap">
				{#if detailLoading}
					<div class="grid-state"><span class="spinner-lg"></span><span>Loading columns…</span></div>
				{:else if colSorted.length === 0}
					<div class="grid-state muted">No columns match the current filter.</div>
				{:else}
					<table class="data-table detail-table">
						<thead>
							<tr>
								{#each [
									{ key: 'sheet_name',   label: 'Table (Sheet)' },
									{ key: 'column_name',  label: 'Column Name'   },
									{ key: 'position',     label: 'Position'      },
									{ key: 'notes',        label: 'Notes'         },
								] as col}
									<th class:active-col={colSortCol === col.key}>
										<button class="th-btn" onclick={() => colSort(col.key)}>
											{col.label}
											<span class="sort-icon">{sortIcon(col.key, colSortCol, colSortDir)}</span>
										</button>
									</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each colRows as col (col.id)}
								<tr>
									<td class="td-sheet">{col.sheet_name}</td>
									<td class="td-colname">{col.column_name}</td>
									<td class="td-num td-pos">{col.position}</td>
									<td class="td-notes">{col.notes ?? '—'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}
			</div>

			<!-- Column pagination -->
			{#if colPageCount > 1}
				<div class="pagination">
					<button class="pg-btn" disabled={colPage === 1} onclick={() => colPage--}>‹</button>
					{#each Array.from({ length: Math.min(colPageCount, 7) }, (_, i) => i + 1) as p}
						<button class="pg-btn" class:pg-active={colPage === p} onclick={() => colPage = p}>{p}</button>
					{/each}
					{#if colPageCount > 7}
						<span class="pg-ellipsis">…</span>
						<button class="pg-btn" class:pg-active={colPage === colPageCount} onclick={() => colPage = colPageCount}>{colPageCount}</button>
					{/if}
					<button class="pg-btn" disabled={colPage === colPageCount} onclick={() => colPage++}>›</button>
					<span class="pg-info">
						{(colPage - 1) * COL_PAGE_SIZE + 1}–{Math.min(colPage * COL_PAGE_SIZE, colSorted.length)} of {colSorted.length}
					</span>
				</div>
			{/if}
		</div>
	{/if}

</div>

<style>
	/* ── Page shell ── */
	.page {
		padding: 28px clamp(16px, 3vw, 48px) 48px;
		display: flex;
		flex-direction: column;
		gap: 20px;
		max-width: 1200px;
		margin: 0 auto;
		width: 100%;
	}

	/* ── Header ── */
	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		flex-wrap: wrap;
	}
	.page-header-left { display: flex; align-items: center; gap: 14px; }
	.page-icon { color: #f5a623; display: flex; }
	.page-title { font-size: 22px; font-weight: 800; color: var(--text-accent); margin: 0 0 3px; letter-spacing: -0.02em; }
	.page-sub { font-size: 12.5px; color: var(--text-muted); margin: 0; }

	.upload-btn {
		display: inline-flex; align-items: center; gap: 8px;
		padding: 10px 20px; border-radius: 12px;
		border: 1px solid rgba(245,166,35,0.35);
		background: rgba(245,166,35,0.12); color: #f5a623;
		font-size: 13px; font-weight: 600; cursor: pointer;
		transition: background .18s, border-color .18s, box-shadow .18s;
		white-space: nowrap;
	}
	.upload-btn:hover {
		background: rgba(245,166,35,0.22); border-color: rgba(245,166,35,0.6);
		box-shadow: 0 0 22px rgba(245,166,35,0.2);
	}

	/* ── Stats ── */
	.stats-row { display: flex; gap: 12px; flex-wrap: wrap; }
	.stat-card {
		flex: 1; min-width: 100px;
		background: var(--bg-base); border-radius: 14px;
		padding: 16px 20px;
		display: flex; flex-direction: column; gap: 4px;
	}
	.stat-value { font-size: 26px; font-weight: 800; color: #f5a623; line-height: 1; }
	.stat-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); }

	/* ── Grid card ── */
	.grid-card, .detail-card {
		background: var(--bg-base);
		border-radius: 18px;
		overflow: hidden;
	}

	/* ── Toolbar ── */
	.grid-toolbar {
		display: flex; align-items: center; justify-content: space-between; gap: 12px;
		padding: 14px 18px;
		border-bottom: 1px solid rgba(255,255,255,0.05);
		flex-wrap: wrap;
	}
	.search-wrap {
		position: relative;
		display: flex; align-items: center;
	}
	.search-icon {
		position: absolute; left: 10px;
		color: var(--text-muted); display: flex; pointer-events: none;
	}
	.search-input {
		background: rgba(255,255,255,0.04);
		border: 1px solid rgba(255,255,255,0.1);
		border-radius: 9px;
		padding: 7px 12px 7px 30px;
		color: var(--text-accent); font-size: 13px;
		outline: none; min-width: 200px;
		transition: border-color .15s;
	}
	.search-input:focus { border-color: rgba(245,166,35,0.4); }
	.search-sm { min-width: 160px; }
	.row-count { font-size: 12px; color: var(--text-muted); white-space: nowrap; }

	/* ── Grid wrap (overflow container) ── */
	.grid-wrap { overflow-x: auto; }

	/* ── Data table ── */
	.data-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 13px;
	}

	.data-table thead tr {
		border-bottom: 1px solid rgba(255,255,255,0.08);
		background: rgba(255,255,255,0.02);
	}

	.data-table th {
		padding: 0;
		color: var(--text-muted);
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.07em;
		text-transform: uppercase;
		text-align: left;
		white-space: nowrap;
		user-select: none;
	}
	.data-table th.active-col { color: #f5a623; }

	.th-btn {
		display: flex; align-items: center; gap: 5px;
		padding: 11px 16px;
		background: none; border: none; cursor: pointer;
		color: inherit; font: inherit; letter-spacing: inherit; text-transform: inherit;
		white-space: nowrap; width: 100%;
		transition: color .15s;
	}
	.th-btn:hover { color: var(--text-accent); }
	.th-actions { padding: 11px 16px; }

	.sort-icon { font-size: 10px; opacity: 0.5; }

	.data-table tbody tr {
		border-bottom: 1px solid rgba(255,255,255,0.04);
		cursor: pointer;
		transition: background .12s;
	}
	.data-table tbody tr:hover { background: rgba(245,166,35,0.04); }
	.data-table tbody tr.selected { background: rgba(245,166,35,0.08); }
	.detail-table tbody tr { cursor: default; }
	.detail-table tbody tr:hover { background: rgba(255,255,255,0.03); }

	.data-table td { padding: 11px 16px; color: var(--text-primary); vertical-align: middle; }

	.td-name { font-weight: 600; color: var(--text-accent); max-width: 220px; }
	.td-file { color: var(--text-muted); font-size: 12px; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.td-num  { text-align: center; font-variant-numeric: tabular-nums; font-weight: 600; color: #f5a623; }
	.td-pos  { color: var(--text-muted); font-size: 12px; }
	.td-date { color: var(--text-muted); font-size: 12px; white-space: nowrap; }
	.td-sheet { color: #00d4ff; font-size: 12px; font-family: monospace; }
	.td-colname { font-weight: 600; font-family: monospace; font-size: 12.5px; }
	.td-notes { color: var(--text-muted); font-size: 12px; max-width: 340px; }

	/* ── Row actions ── */
	.td-actions { display: flex; align-items: center; gap: 6px; }
	.action-btn {
		display: inline-flex; align-items: center; gap: 5px;
		padding: 5px 10px; border-radius: 7px; border: 1px solid;
		font-size: 11.5px; font-weight: 600; cursor: pointer;
		transition: background .14s, border-color .14s;
		white-space: nowrap;
	}
	.view-btn {
		background: rgba(0,212,255,0.08); border-color: rgba(0,212,255,0.2); color: #00d4ff;
	}
	.view-btn:hover, .view-btn.active {
		background: rgba(0,212,255,0.18); border-color: rgba(0,212,255,0.5);
	}
	.del-btn {
		background: rgba(255,77,109,0.08); border-color: rgba(255,77,109,0.2); color: #ff4d6d;
		padding: 5px 8px;
	}
	.del-btn:hover { background: rgba(255,77,109,0.18); border-color: rgba(255,77,109,0.5); }
	.del-btn:disabled { opacity: 0.5; cursor: not-allowed; }

	/* ── Grid states ── */
	.grid-state {
		display: flex; align-items: center; justify-content: center; gap: 10px;
		padding: 52px 24px;
		font-size: 13.5px; color: var(--text-muted);
	}
	.error-state { color: #ff4d6d; }

	/* ── Pagination ── */
	.pagination {
		display: flex; align-items: center; gap: 4px;
		padding: 12px 18px;
		border-top: 1px solid rgba(255,255,255,0.05);
		flex-wrap: wrap;
	}
	.pg-btn {
		min-width: 32px; height: 32px; padding: 0 8px;
		display: flex; align-items: center; justify-content: center;
		border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);
		background: transparent; color: var(--text-muted);
		font-size: 13px; cursor: pointer;
		transition: background .14s, border-color .14s, color .14s;
	}
	.pg-btn:hover:not(:disabled) { background: rgba(245,166,35,0.1); color: #f5a623; border-color: rgba(245,166,35,0.3); }
	.pg-btn:disabled { opacity: 0.35; cursor: not-allowed; }
	.pg-active { background: rgba(245,166,35,0.15) !important; color: #f5a623 !important; border-color: rgba(245,166,35,0.4) !important; }
	.pg-ellipsis { color: var(--text-muted); font-size: 13px; padding: 0 4px; }
	.pg-info { margin-left: auto; font-size: 11.5px; color: var(--text-muted); white-space: nowrap; }

	/* ── Detail panel ── */
	.detail-header {
		display: flex; align-items: center; justify-content: space-between; gap: 14px;
		padding: 16px 18px;
		border-bottom: 1px solid rgba(255,255,255,0.05);
		flex-wrap: wrap;
	}
	.detail-header-left { display: flex; align-items: center; gap: 10px; }
	.detail-icon { color: #f5a623; display: flex; }
	.detail-title { font-size: 14px; font-weight: 700; color: var(--text-accent); margin: 0 0 2px; }
	.detail-sub { font-size: 11px; color: var(--text-muted); margin: 0; }
	.detail-controls { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

	/* Sheet select */
	.select-wrap { position: relative; display: flex; align-items: center; }
	.sheet-select {
		appearance: none;
		background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
		border-radius: 9px; padding: 7px 28px 7px 12px;
		color: var(--text-accent); font-size: 12.5px; cursor: pointer; outline: none;
		transition: border-color .15s;
	}
	.sheet-select:focus { border-color: rgba(245,166,35,0.4); }
	.select-arrow { position: absolute; right: 8px; color: var(--text-muted); pointer-events: none; }

	.icon-close-btn {
		width: 30px; height: 30px;
		display: flex; align-items: center; justify-content: center;
		border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);
		background: rgba(255,255,255,0.04); color: var(--text-muted); cursor: pointer;
		transition: background .14s, color .14s;
	}
	.icon-close-btn:hover { background: rgba(255,77,109,0.12); color: #ff4d6d; }

	/* ── Spinners ── */
	.spinner-lg {
		width: 20px; height: 20px;
		border: 2px solid rgba(245,166,35,0.2); border-top-color: #f5a623;
		border-radius: 50%; animation: spin .8s linear infinite;
	}
	.spinner-sm {
		width: 11px; height: 11px;
		border: 2px solid rgba(255,77,109,0.2); border-top-color: #ff4d6d;
		border-radius: 50%; animation: spin .7s linear infinite;
		display: inline-block;
	}
	@keyframes spin { to { transform: rotate(360deg); } }

	/* ── Toast ── */
	.toast {
		position: fixed; bottom: 24px; right: 24px; z-index: 300;
		padding: 11px 20px; border-radius: 12px;
		background: rgba(0,230,118,0.15); border: 1px solid rgba(0,230,118,0.35);
		color: #00e676; font-size: 13px; font-weight: 600;
		box-shadow: 0 8px 32px rgba(0,0,0,0.4);
		animation: toast-in 0.2s ease-out;
	}
	.toast-error { background: rgba(255,77,109,0.15); border-color: rgba(255,77,109,0.35); color: #ff4d6d; }
	@keyframes toast-in { from { opacity: 0; transform: translateY(10px); } }
</style>
