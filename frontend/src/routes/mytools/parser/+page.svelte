<script>
	import { onMount } from 'svelte';
	import { useClerkContext } from 'svelte-clerk';
	import { ICON_MAP } from '$lib/data/icons.js';
	import { apiFetch } from '$lib/api.js';
	import { NewFileParserDialog } from '$lib/components/FileParser/index.js';

	const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

	const { session, clerk } = useClerkContext();
	const auth = { session, signOut: () => clerk?.signOut() ?? Promise.resolve() };

	// ── Icons ──────────────────────────────────────────────────────────────────
	const FileIcon    = ICON_MAP['FileSearch'];
	const PlusIcon    = ICON_MAP['Zap'];
	const TrashIcon   = ICON_MAP['Trash2'];
	const EditIcon    = ICON_MAP['RefreshCw'];

	// ── State ──────────────────────────────────────────────────────────────────
	/** @type {any[]} */
	let parsers    = $state([]);
	let loading    = $state(true);
	let fetchError = $state('');
	let dialogOpen = $state(false);
	let deletingId = $state(/** @type {string|null} */ (null));

	/** @type {{ text: string, type: 'success'|'error' } | null} */
	let toast = $state(null);
	/** @type {ReturnType<typeof setTimeout>|null} */
	let toastTimer = null;

	// ── Stats ──────────────────────────────────────────────────────────────────
	const stats = $derived({
		total:      parsers.length,
		csv:        parsers.filter(/** @param {any} p */ p => p.file_extension === 'csv').length,
		txt:        parsers.filter(/** @param {any} p */ p => p.file_extension === 'txt').length,
		fixed:      parsers.filter(/** @param {any} p */ p => p.parse_type === 'fixed_length').length,
		delimited:  parsers.filter(/** @param {any} p */ p => p.parse_type === 'delimited').length,
	});

	// ── Toast ──────────────────────────────────────────────────────────────────
	/** @param {string} text @param {'success'|'error'} [type] */
	function showToast(text, type = 'success') {
		if (toastTimer) clearTimeout(toastTimer);
		toast = { text, type };
		toastTimer = setTimeout(() => { toast = null; }, 4200);
	}

	// ── API ────────────────────────────────────────────────────────────────────
	async function loadParsers() {
		loading = true; fetchError = '';
		try {
			const res = await apiFetch(`${API}/api/parsers`, {}, auth);
			if (!res.ok) throw new Error(`Server error ${res.status}`);
			parsers = await res.json();
		} catch (err) {
			fetchError = /** @type {Error} */ (err).message;
		} finally { loading = false; }
	}

	/** @param {any} payload */
	async function saveParser(payload) {
		const res  = await apiFetch(`${API}/api/parsers`, {
			method: 'POST',
			body: JSON.stringify(payload),
		}, auth);
		const data = await res.json();
		if (!res.ok) throw new Error(data.detail ?? data.error ?? `Server error ${res.status}`);
		parsers = [data, ...parsers];
		dialogOpen = false;
		showToast('File parser created');
	}

	/** @param {string} id */
	async function deleteParser(id) {
		try {
			const res  = await apiFetch(`${API}/api/parsers/${id}`, { method: 'DELETE' }, auth);
			const data = await res.json();
			if (!res.ok) throw new Error(data.detail ?? data.error ?? 'Delete failed');
			parsers = parsers.filter(p => p.id !== id);
			showToast('Parser deleted');
		} catch (err) {
			showToast(/** @type {Error} */ (err).message, 'error');
		} finally { deletingId = null; }
	}

	// ── Helpers ────────────────────────────────────────────────────────────────
	/** @param {string|null} iso */
	function relativeTime(iso) {
		if (!iso) return '—';
		const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
		if (m < 1) return 'just now';
		if (m < 60) return `${m}m ago`;
		const h = Math.floor(m / 60);
		if (h < 24) return `${h}h ago`;
		return `${Math.floor(h / 24)}d ago`;
	}

	/** @param {string} pt */
	function parseTypeLabel(pt) {
		return pt === 'fixed_length' ? 'Fixed Length' : 'Delimited';
	}

	/** @param {string} ext */
	function extColor(ext) {
		return ext === 'csv' ? '#00e676' : '#4fc3f7';
	}

	onMount(loadParsers);
</script>

<svelte:head><title>File Parser — OraCodeX Nexus</title></svelte:head>

<!-- Toast -->
{#if toast}
	<div class="toast toast-{toast.type}" role="alert">
		<span class="toast-dot"></span>{toast.text}
	</div>
{/if}

<!-- New parser dialog -->
{#if dialogOpen}
	<NewFileParserDialog
		onSave={saveParser}
		onClose={() => { dialogOpen = false; }}
	/>
{/if}

<!-- Page -->
<div class="page">

	<!-- Header -->
	<div class="page-header">
		<div class="page-header-left">
			<span class="page-icon">{#if FileIcon}<FileIcon size={28} strokeWidth={1.4} />{/if}</span>
			<div>
				<h1 class="page-title">File Parser</h1>
				<p class="page-sub">Define and manage file parsing configurations</p>
			</div>
		</div>
		<button class="btn btn-primary" onclick={() => { dialogOpen = true; }}>
			{#if PlusIcon}<span class="btn-icon"><PlusIcon size={14} /></span>{/if}
			New File Parser
		</button>
	</div>

	<!-- Stats -->
	<div class="stats-bar">
		<div class="stat"><span class="stat-val">{stats.total}</span><span class="stat-label">Total</span></div>
		<div class="stat stat-csv"><span class="stat-val">{stats.csv}</span><span class="stat-label">CSV</span></div>
		<div class="stat stat-txt"><span class="stat-val">{stats.txt}</span><span class="stat-label">TXT</span></div>
		<div class="stat stat-delimited"><span class="stat-val">{stats.delimited}</span><span class="stat-label">Delimited</span></div>
		<div class="stat stat-fixed"><span class="stat-val">{stats.fixed}</span><span class="stat-label">Fixed Length</span></div>
	</div>

	<!-- List -->
	<div class="list-wrap">
		{#if loading}
			{#each { length: 3 } as _}
				<div class="parser-row skeleton">
					<div class="sk-icon"></div>
					<div class="sk-lines"><div class="sk-line sk-w60"></div><div class="sk-line sk-w40"></div></div>
					<div class="sk-badge"></div>
					<div class="sk-actions"><div class="sk-btn"></div><div class="sk-btn"></div></div>
				</div>
			{/each}

		{:else if fetchError}
			<div class="empty-state">
				<div class="empty-icon error-icon">!</div>
				<p class="empty-title">Cannot reach backend</p>
				<p class="empty-sub">{fetchError}</p>
				<button class="btn btn-ghost" onclick={loadParsers}>Retry</button>
			</div>

		{:else if parsers.length === 0}
			<div class="empty-state">
				{#if FileIcon}<div class="empty-icon"><FileIcon size={40} strokeWidth={1.2} /></div>{/if}
				<p class="empty-title">No file parsers yet</p>
				<p class="empty-sub">Create your first file parser to define how your files are read.</p>
				<button class="btn btn-primary" onclick={() => { dialogOpen = true; }}>
					{#if PlusIcon}<span class="btn-icon"><PlusIcon size={14} /></span>{/if}
					New File Parser
				</button>
			</div>

		{:else}
			<div class="table-head">
				<span>Parser</span>
				<span>File</span>
				<span>Type</span>
				<span>Columns</span>
				<span>Created</span>
				<span></span>
			</div>

			{#each parsers as parser (parser.id)}
				<div class="parser-row">

					<div class="col-name">
						<span class="parser-icon">
							{#if FileIcon}<FileIcon size={17} strokeWidth={1.4} />{/if}
						</span>
						<div class="parser-info">
							<span class="parser-name">{parser.name}</span>
							<span class="parser-file">{parser.original_filename}</span>
						</div>
					</div>

					<div class="col-file">
						<span class="ext-badge" style="background:{extColor(parser.file_extension)}18; color:{extColor(parser.file_extension)}; border-color:{extColor(parser.file_extension)}44">
							.{parser.file_extension}
						</span>
					</div>

					<div class="col-type">
						<span class="type-badge">
							{parseTypeLabel(parser.parse_type)}
							{#if parser.parse_type === 'delimited' && parser.delimiter_char}
								<span class="delimiter-hint">
									{parser.delimiter_char === '\t' ? 'Tab' : `"${parser.delimiter_char}"`}
								</span>
							{/if}
						</span>
					</div>

					<div class="col-cols">
						<span class="col-count">{parser.columns?.length ?? 0} col{(parser.columns?.length ?? 0) !== 1 ? 's' : ''}</span>
					</div>

					<div class="col-date">
						<span class="date-label">{relativeTime(parser.created_at)}</span>
					</div>

					<div class="col-actions">
						{#if deletingId === parser.id}
							<span class="delete-confirm">
								Delete?
								<button class="btn-sm btn-danger" onclick={() => deleteParser(parser.id)}>Yes</button>
								<button class="btn-sm btn-ghost-sm" onclick={() => (deletingId = null)}>No</button>
							</span>
						{:else}
							<button class="action-btn edit-btn" title="Edit (coming soon)" disabled>
								{#if EditIcon}<EditIcon size={12} />{/if} Edit
							</button>
							<button class="action-btn delete-btn" onclick={() => (deletingId = parser.id)} title="Delete">
								{#if TrashIcon}<TrashIcon size={12} />{/if}
							</button>
						{/if}
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	/* ── Page ── */
	.page { padding: 32px 36px 64px; max-width: 1100px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; box-sizing: border-box; }

	.page-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
	.page-header-left { display: flex; align-items: center; gap: 14px; }
	.page-icon { display: flex; align-items: center; color: #ff4d6d; filter: drop-shadow(0 0 10px rgba(255,77,109,0.4)); }
	.page-title { font-size: 20px; font-weight: 700; color: var(--text-accent); margin: 0 0 2px; letter-spacing: -0.02em; }
	.page-sub   { font-size: 12.5px; color: var(--text-muted); margin: 0; }

	/* ── Stats ── */
	.stats-bar { display: flex; gap: 12px; flex-wrap: wrap; }
	.stat {
		display: flex; flex-direction: column; align-items: center; gap: 2px;
		padding: 14px 24px; border-radius: 14px;
		background: var(--bg-base); border: 1px solid rgba(255,255,255,0.06);
		box-shadow: -3px -3px 8px var(--shadow-light), 3px 3px 8px var(--shadow-dark);
		min-width: 88px;
	}
	.stat-val   { font-size: 22px; font-weight: 700; color: var(--text-accent); line-height: 1; }
	.stat-label { font-size: 10.5px; font-weight: 500; color: var(--text-muted); letter-spacing: 0.05em; text-transform: uppercase; }
	.stat-csv  .stat-val { color: #00e676; }
	.stat-txt  .stat-val { color: #4fc3f7; }
	.stat-delimited .stat-val { color: #b39ddb; }
	.stat-fixed     .stat-val { color: #f5a623; }

	/* ── List ── */
	.list-wrap {
		display: flex; flex-direction: column;
		border-radius: 16px; background: var(--bg-base);
		border: 1px solid rgba(255,255,255,0.06);
		box-shadow: -4px -4px 12px var(--shadow-light), 4px 4px 12px var(--shadow-dark);
		overflow: hidden;
	}

	.table-head {
		display: grid;
		grid-template-columns: 1.8fr 80px 160px 90px 110px auto;
		gap: 12px; padding: 10px 20px;
		background: rgba(255,255,255,0.025);
		border-bottom: 1px solid rgba(255,255,255,0.06);
		font-size: 10.5px; font-weight: 600; letter-spacing: 0.08em;
		text-transform: uppercase; color: var(--text-muted);
	}

	.parser-row {
		display: grid;
		grid-template-columns: 1.8fr 80px 160px 90px 110px auto;
		gap: 12px; align-items: center;
		padding: 14px 20px;
		border-bottom: 1px solid rgba(255,255,255,0.04);
		transition: background 0.14s;
	}
	.parser-row:last-child { border-bottom: none; }
	.parser-row:hover { background: rgba(255,255,255,0.018); }

	/* ── Cols ── */
	.col-name { display: flex; align-items: center; gap: 10px; min-width: 0; }
	.parser-icon { flex-shrink: 0; display: flex; align-items: center; color: #ff4d6d; }
	.parser-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
	.parser-name { font-size: 13.5px; font-weight: 600; color: var(--text-accent); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.parser-file { font-size: 11.5px; color: var(--text-muted); font-family: monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

	.ext-badge {
		padding: 3px 9px; border-radius: 6px; border: 1px solid;
		font-size: 11px; font-weight: 700; letter-spacing: 0.04em; font-family: monospace;
		display: inline-flex; align-items: center;
	}

	.type-badge {
		display: inline-flex; align-items: center; gap: 5px;
		font-size: 12px; font-weight: 500; color: var(--text-muted);
	}
	.delimiter-hint {
		font-size: 10.5px; font-family: monospace;
		color: #b39ddb; background: rgba(179,157,219,0.1);
		border: 1px solid rgba(179,157,219,0.2);
		border-radius: 5px; padding: 1px 6px;
	}

	.col-count { font-size: 12.5px; color: var(--text-muted); font-weight: 500; }
	.date-label { font-size: 12px; color: var(--text-muted); }

	.col-actions { display: flex; align-items: center; gap: 6px; justify-content: flex-end; }

	/* ── Action buttons ── */
	.action-btn {
		display: inline-flex; align-items: center; gap: 5px;
		padding: 5px 10px; border-radius: 8px;
		border: 1px solid rgba(255,255,255,.1);
		background: rgba(255,255,255,.04);
		color: var(--text-muted); font-size: 12px; font-weight: 500;
		cursor: pointer; white-space: nowrap;
		transition: background .14s, border-color .14s, color .14s;
	}
	.action-btn:disabled { opacity: .35; cursor: not-allowed; }
	.edit-btn:hover:not(:disabled) { background: rgba(179,157,219,.1); border-color: rgba(179,157,219,.3); color: #b39ddb; }
	.delete-btn { padding: 5px 8px; }
	.delete-btn:hover { background: rgba(255,77,109,.1); border-color: rgba(255,77,109,.3); color: #ff4d6d; }

	.delete-confirm { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #ff4d6d; font-weight: 600; }
	.btn-sm { padding: 3px 8px; border-radius: 6px; border: 1px solid; font-size: 11px; font-weight: 600; cursor: pointer; transition: background .12s; }
	.btn-danger  { background: rgba(255,77,109,.15); border-color: rgba(255,77,109,.4); color: #ff4d6d; }
	.btn-danger:hover { background: rgba(255,77,109,.25); }
	.btn-ghost-sm { background: rgba(255,255,255,.05); border-color: rgba(255,255,255,.12); color: var(--text-muted); }
	.btn-ghost-sm:hover { background: rgba(255,255,255,.1); }

	/* ── Skeleton ── */
	.skeleton { opacity: .5; }
	.sk-icon,.sk-badge,.sk-btn { background: rgba(255,255,255,.07); border-radius: 6px; animation: pulse 1.5s ease-in-out infinite; }
	.sk-icon { width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0; }
	.sk-badge { width: 60px; height: 24px; border-radius: 8px; }
	.sk-btn { width: 52px; height: 28px; border-radius: 8px; }
	.sk-lines { display: flex; flex-direction: column; gap: 6px; flex: 1; }
	.sk-line { height: 10px; border-radius: 5px; background: rgba(255,255,255,.07); animation: pulse 1.5s ease-in-out infinite; }
	.sk-w60 { width: 60%; } .sk-w40 { width: 40%; }
	.sk-actions { display: flex; gap: 6px; }
	@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

	/* ── Empty / error ── */
	.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 64px 24px; text-align: center; }
	.empty-icon { color: #ff4d6d; opacity: .5; margin-bottom: 4px; }
	.error-icon { font-size: 40px; opacity: .7; }
	.empty-title { font-size: 15px; font-weight: 600; color: var(--text-accent); margin: 0; }
	.empty-sub   { font-size: 13px; color: var(--text-muted); margin: 0; max-width: 340px; }

	/* ── Buttons ── */
	.btn {
		display: inline-flex; align-items: center; gap: 7px;
		padding: 9px 18px; border-radius: 10px; border: 1px solid;
		font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap;
		transition: background .15s, border-color .15s, box-shadow .15s;
	}
	.btn:disabled { opacity: .5; cursor: not-allowed; }
	.btn-primary {
		background: rgba(255,77,109,.15); border-color: rgba(255,77,109,.35); color: #ff4d6d;
	}
	.btn-primary:hover:not(:disabled) {
		background: rgba(255,77,109,.25); border-color: rgba(255,77,109,.6);
		box-shadow: 0 0 18px rgba(255,77,109,.2);
	}
	.btn-ghost { background: rgba(255,255,255,.04); border-color: rgba(255,255,255,.1); color: var(--text-muted); }
	.btn-ghost:hover { background: rgba(255,255,255,.08); color: var(--text-primary); }
	.btn-icon { display: flex; align-items: center; }

	/* ── Toast ── */
	.toast {
		position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
		z-index: 300; display: flex; align-items: center; gap: 10px;
		padding: 11px 20px; border-radius: 12px; border: 1px solid;
		font-size: 13px; font-weight: 500; box-shadow: 0 8px 32px rgba(0,0,0,.4);
		animation: toast-in .22s ease-out; backdrop-filter: blur(12px); white-space: nowrap;
	}
	.toast-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
	.toast-success { background: rgba(0,230,118,.12); border-color: rgba(0,230,118,.3); color: #00e676; }
	.toast-success .toast-dot { background: #00e676; box-shadow: 0 0 6px #00e676; }
	.toast-error { background: rgba(255,77,109,.12); border-color: rgba(255,77,109,.3); color: #ff4d6d; }
	.toast-error .toast-dot { background: #ff4d6d; }
	@keyframes toast-in {
		from { opacity: 0; transform: translateX(-50%) translateY(12px); }
		to   { opacity: 1; transform: translateX(-50%) translateY(0); }
	}

	/* ── Responsive ── */
	@media (max-width: 840px) {
		.page { padding: 20px 16px 48px; }
		.table-head { display: none; }
		.parser-row { grid-template-columns: 1fr; gap: 8px; padding: 14px 16px; }
		.col-actions { justify-content: flex-start; }
	}
</style>
