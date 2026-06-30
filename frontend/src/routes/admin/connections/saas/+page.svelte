<script>
	import { onMount } from 'svelte';
	import { useClerkContext } from 'svelte-clerk';
	import { ICON_MAP } from '$lib/data/icons.js';

	const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

	const { session } = useClerkContext();

	async function authHeaders() {
		const token = await session?.getToken();
		return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
	}

	// ── Icons ──────────────────────────────────────────────────────────────────
	const CloudIcon   = ICON_MAP['Cloud'];
	const PlusIcon    = ICON_MAP['Zap'];
	const TrashIcon   = ICON_MAP['Trash2'];
	const EditIcon    = ICON_MAP['RefreshCw'];
	const PlayIcon    = ICON_MAP['Play'];
	const EyeIcon     = ICON_MAP['BookOpen'];
	const EyeOffIcon  = ICON_MAP['EyeOff'];
	const NetworkIcon = ICON_MAP['Network'];
	const ServerIcon  = ICON_MAP['Server'];
	const LockIcon    = ICON_MAP['Lock'];
	const HistoryIcon = ICON_MAP['History'];

	// ── State ──────────────────────────────────────────────────────────────────
	/** @type {any[]} */
	let connections = $state([]);
	let loading     = $state(true);
	let fetchError  = $state('');
	let modalOpen   = $state(false);
	let editingId   = $state(/** @type {string|null} */ (null));
	let showPass    = $state(false);
	let saving      = $state(false);
	let testingId   = $state(/** @type {string|null} */ (null));
	let deletingId  = $state(/** @type {string|null} */ (null));

	/** @type {{ text: string, type: 'success'|'error' } | null} */
	let toast = $state(null);
	let toastTimer = /** @type {ReturnType<typeof setTimeout>|null} */ (null);

	/** @type {Record<string, {success: boolean, message: string, latency_ms: number}>} */
	let testResults = $state({});
	/** @type {Record<string, ReturnType<typeof setTimeout>>} */
	const resultTimers = {};

	/** @param {string} id */
	function dismissResult(id) {
		if (resultTimers[id]) { clearTimeout(resultTimers[id]); delete resultTimers[id]; }
		const copy = { ...testResults };
		delete copy[id];
		testResults = copy;
	}

	/** @param {string} id @param {{success: boolean, message: string, latency_ms: number}} result */
	function storeResult(id, result) {
		if (resultTimers[id]) clearTimeout(resultTimers[id]);
		testResults = { ...testResults, [id]: result };
		resultTimers[id] = setTimeout(() => dismissResult(id), 10000);
	}

	let form = $state({ connection_name: '', username: '', password: '', instance_url: '' });

	// ── Derived stats ──────────────────────────────────────────────────────────
	const stats = $derived({
		total:    connections.length,
		success:  connections.filter(/** @param {any} c */ c => c.status === 'success').length,
		failed:   connections.filter(/** @param {any} c */ c => c.status === 'failed').length,
		untested: connections.filter(/** @param {any} c */ c => c.status === 'untested').length,
	});

	// ── Toast ──────────────────────────────────────────────────────────────────
	/** @param {string} text @param {'success'|'error'} [type] */
	function showToast(text, type = 'success') {
		if (toastTimer) clearTimeout(toastTimer);
		toast = { text, type };
		toastTimer = setTimeout(() => { toast = null; }, 4200);
	}

	// ── API ────────────────────────────────────────────────────────────────────
	async function loadConnections() {
		loading = true; fetchError = '';
		try {
			const res = await fetch(`${API}/api/connections`, { headers: await authHeaders() });
			if (!res.ok) throw new Error(`Server error ${res.status}`);
			connections = await res.json();
		} catch (err) {
			fetchError = /** @type {Error} */ (err).message;
		} finally { loading = false; }
	}

	async function saveConnection() {
		if (!form.connection_name.trim() || !form.username.trim() || !form.instance_url.trim()) {
			showToast('Connection name, username and instance URL are required', 'error');
			return;
		}
		if (!editingId && !form.password.trim()) {
			showToast('Password is required for new connections', 'error');
			return;
		}
		saving = true;
		try {
			const url    = editingId ? `${API}/api/connections/${editingId}` : `${API}/api/connections`;
			const method = editingId ? 'PUT' : 'POST';
			const payload = { ...form };
			if (editingId && !payload.password) delete payload.password;

			const res  = await fetch(url, { method, headers: await authHeaders(), body: JSON.stringify(payload) });
			const data = await res.json();
			if (!res.ok) throw new Error(data.detail ?? data.error ?? `Server error ${res.status}`);

			if (editingId) {
				connections = connections.map(c => c.id === editingId ? data : c);
				showToast('Connection updated');
			} else {
				connections = [data, ...connections];
				showToast('Connection created');
			}
			closeModal();
		} catch (err) {
			showToast(/** @type {Error} */ (err).message, 'error');
		} finally { saving = false; }
	}

	/** @param {string} id */
	async function testConnection(id) {
		testingId = id;
		dismissResult(id);
		try {
			const res  = await fetch(`${API}/api/connections/${id}/test`, { method: 'POST', headers: await authHeaders() });
			const data = await res.json();
			if (!res.ok) throw new Error(data.detail ?? data.error ?? 'Test failed');
			connections = connections.map(c => c.id === id ? data.connection : c);
			storeResult(id, { success: data.success, message: data.message, latency_ms: data.latency_ms });
			showToast(
				data.success ? `Connected — ${data.latency_ms}ms` : `Failed: ${data.message}`,
				data.success ? 'success' : 'error',
			);
		} catch (err) {
			const msg = /** @type {Error} */ (err).message;
			storeResult(id, { success: false, message: msg, latency_ms: 0 });
			showToast(msg, 'error');
		} finally { testingId = null; }
	}

	/** @param {string} id */
	async function deleteConnection(id) {
		try {
			const res  = await fetch(`${API}/api/connections/${id}`, { method: 'DELETE', headers: await authHeaders() });
			const data = await res.json();
			if (!res.ok) throw new Error(data.detail ?? data.error ?? 'Delete failed');
			connections = connections.filter(c => c.id !== id);
			showToast('Connection deleted');
		} catch (err) {
			showToast(/** @type {Error} */ (err).message, 'error');
		} finally { deletingId = null; }
	}

	// ── Modal helpers ──────────────────────────────────────────────────────────
	function openNewModal() {
		editingId = null;
		form = { connection_name: '', username: '', password: '', instance_url: '' };
		showPass = false;
		modalOpen = true;
	}

	/** @param {any} conn */
	function openEditModal(conn) {
		editingId = conn.id;
		form = { connection_name: conn.connection_name, username: conn.username, password: '', instance_url: conn.instance_url };
		showPass = false;
		modalOpen = true;
	}

	function closeModal() { modalOpen = false; editingId = null; }

	/** @param {KeyboardEvent} e */
	function onKeydown(e) { if (e.key === 'Escape' && modalOpen) closeModal(); }

	// ── Utilities ──────────────────────────────────────────────────────────────
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

	onMount(loadConnections);
</script>

<svelte:window onkeydown={onKeydown} />
<svelte:head><title>Oracle Cloud SaaS Connections — OraCodeX Studio</title></svelte:head>

<!-- ── Toast ─────────────────────────────────────────────────────────────────── -->
{#if toast}
	<div class="toast toast-{toast.type}" role="alert">
		<span class="toast-dot"></span>{toast.text}
	</div>
{/if}

<!-- ── Modal ─────────────────────────────────────────────────────────────────── -->
{#if modalOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="modal-overlay" onclick={closeModal}>
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div class="modal-card" onclick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="modal-title">

			<!-- Decorative glow orbs inside card -->
			<span class="modal-orb orb-1" aria-hidden="true"></span>
			<span class="modal-orb orb-2" aria-hidden="true"></span>

			<!-- Header -->
			<div class="modal-header">
				<div class="modal-header-left">
					<span class="modal-header-icon">
						{#if LockIcon}<LockIcon size={18} strokeWidth={1.5} />{/if}
					</span>
					<div>
						<h2 class="modal-title" id="modal-title">
							{editingId ? 'Edit Connection' : 'New Oracle Cloud Connection'}
						</h2>
						<p class="modal-subtitle">
							{editingId ? 'Update credentials or URL for this connection' : 'Connect an Oracle Fusion Cloud SaaS environment'}
						</p>
					</div>
				</div>
				<button class="close-btn" onclick={closeModal} aria-label="Close">
					<svg viewBox="0 0 16 16" fill="none" width="14" height="14">
						<path d="M2 2l12 12M14 2L2 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
					</svg>
				</button>
			</div>

			<!-- Divider -->
			<div class="modal-divider"></div>

			<!-- Form -->
			<form class="modal-form" onsubmit={e => { e.preventDefault(); saveConnection(); }}>
				<!-- Row 1: Name + URL -->
				<div class="form-row">
					<label class="field">
						<span class="field-label">Connection Name <span class="req">*</span></span>
						<input class="input" type="text" placeholder="e.g. Production ERP" bind:value={form.connection_name} required />
					</label>
					<label class="field">
						<span class="field-label">Instance URL <span class="req">*</span></span>
						<input class="input" type="url" placeholder="https://company.fa.us2.oraclecloud.com" bind:value={form.instance_url} required />
						<span class="field-hint">Must be an *.oraclecloud.com domain</span>
					</label>
				</div>

				<!-- Row 2: Username + Password -->
				<div class="form-row">
					<label class="field">
						<span class="field-label">Username <span class="req">*</span></span>
						<input class="input" type="text" placeholder="user@company.com" bind:value={form.username} required />
					</label>
					<label class="field">
						<span class="field-label">
							Password
							{#if editingId}
								<span class="field-hint-inline"> — leave blank to keep current</span>
							{:else}
								<span class="req">*</span>
							{/if}
						</span>
						<div class="pass-wrap">
							{#if showPass}
								<input class="input pass-input" type="text" placeholder={editingId ? '••••••••' : 'Enter password'} bind:value={form.password} />
							{:else}
								<input class="input pass-input" type="password" placeholder={editingId ? '••••••••' : 'Enter password'} bind:value={form.password} />
							{/if}
							<button type="button" class="eye-btn" onclick={() => (showPass = !showPass)} aria-label={showPass ? 'Hide' : 'Show'}>
								{#if showPass && EyeOffIcon}<EyeOffIcon size={14} />{:else if EyeIcon}<EyeIcon size={14} />{/if}
							</button>
						</div>
						<span class="field-hint">Encrypted with AES-256-GCM before storage</span>
					</label>
				</div>

				<!-- Footer -->
				<div class="modal-footer">
					<div class="footer-note">
						{#if LockIcon}<span class="footer-lock"><LockIcon size={11} /></span>{/if}
						Credentials are encrypted end-to-end and never logged
					</div>
					<div class="footer-actions">
						<button type="button" class="btn btn-ghost" onclick={closeModal}>Cancel</button>
						<button type="submit" class="btn btn-primary" disabled={saving}>
							{#if saving}<span class="btn-spinner"></span>{/if}
							{saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Connection'}
						</button>
					</div>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- ── Page ───────────────────────────────────────────────────────────────────── -->
<div class="page">

	<!-- Header -->
	<div class="page-header">
		<div class="page-header-left">
			<span class="page-icon">{#if CloudIcon}<CloudIcon size={28} strokeWidth={1.4} />{/if}</span>
			<div>
				<h1 class="page-title">Oracle Cloud SaaS Connections</h1>
				<p class="page-sub">Manage credentials for Oracle Fusion Cloud environments</p>
			</div>
		</div>
		<button class="btn btn-primary" onclick={openNewModal}>
			{#if PlusIcon}<span class="btn-icon"><PlusIcon size={14} /></span>{/if}
			New Connection
		</button>
	</div>

	<!-- Stats -->
	<div class="stats-bar">
		<div class="stat"><span class="stat-val">{stats.total}</span><span class="stat-label">Total</span></div>
		<div class="stat stat-success"><span class="stat-val">{stats.success}</span><span class="stat-label">Connected</span></div>
		<div class="stat stat-failed"><span class="stat-val">{stats.failed}</span><span class="stat-label">Failed</span></div>
		<div class="stat stat-untested"><span class="stat-val">{stats.untested}</span><span class="stat-label">Untested</span></div>
	</div>

	<!-- Connection list -->
	<div class="list-wrap">
		{#if loading}
			{#each { length: 3 } as _}
				<div class="conn-row skeleton">
					<div class="sk-icon"></div>
					<div class="sk-lines"><div class="sk-line sk-w60"></div><div class="sk-line sk-w40"></div></div>
					<div class="sk-badge"></div>
					<div class="sk-actions"><div class="sk-btn"></div><div class="sk-btn"></div><div class="sk-btn"></div></div>
				</div>
			{/each}

		{:else if fetchError}
			<div class="empty-state">
				<div class="empty-icon error-icon">!</div>
				<p class="empty-title">Cannot reach backend</p>
				<p class="empty-sub">{fetchError}</p>
				<p class="empty-hint">Start the server: <code>uvicorn main:app --reload</code> in <code>backend/</code></p>
				<button class="btn btn-ghost" onclick={loadConnections}>Retry</button>
			</div>

		{:else if connections.length === 0}
			<div class="empty-state">
				{#if NetworkIcon}<div class="empty-icon"><NetworkIcon size={40} strokeWidth={1.2} /></div>{/if}
				<p class="empty-title">No connections yet</p>
				<p class="empty-sub">Add your first Oracle Cloud SaaS connection to get started.</p>
				<button class="btn btn-primary" onclick={openNewModal}>
					{#if PlusIcon}<span class="btn-icon"><PlusIcon size={14} /></span>{/if}
					New Connection
				</button>
			</div>

		{:else}
			<div class="table-head">
				<span>Connection</span>
				<span>Instance URL</span>
				<span>Status</span>
				<span>Last Tested</span>
				<span></span>
			</div>

			{#each connections as conn (conn.id)}
				<div class="conn-row" class:row-success={conn.status === 'success'} class:row-failed={conn.status === 'failed'}>

					<div class="col-name">
						<span class="conn-icon">{#if ServerIcon}<ServerIcon size={17} strokeWidth={1.4} />{/if}</span>
						<div class="conn-info">
							<span class="conn-name">{conn.connection_name}</span>
							<span class="conn-user">
								{#if LockIcon}<span class="inline-icon"><LockIcon size={10} /></span>{/if}
								{conn.username}
							</span>
						</div>
					</div>

					<div class="col-url">
						<span class="conn-url" title={conn.instance_url}>{conn.instance_url}</span>
					</div>

					<div class="col-status">
						<span class="badge badge-{conn.status}">
							<span class="badge-dot"></span>
							{conn.status === 'success' ? 'Connected' : conn.status === 'failed' ? 'Failed' : 'Untested'}
						</span>
						{#if conn.status === 'failed' && conn.error_message}
							<span class="error-hint" title={conn.error_message}>ⓘ</span>
						{/if}
					</div>

					<div class="col-tested">
						{#if HistoryIcon}<span class="inline-icon muted"><HistoryIcon size={11} /></span>{/if}
						<span class="tested-time">{relativeTime(conn.last_tested_at)}</span>
					</div>

					<div class="col-actions">
						{#if deletingId === conn.id}
							<span class="delete-confirm">
								Delete?
								<button class="btn-sm btn-danger" onclick={() => deleteConnection(conn.id)}>Yes</button>
								<button class="btn-sm btn-ghost-sm" onclick={() => (deletingId = null)}>No</button>
							</span>
						{:else}
							<button class="action-btn test-btn" onclick={() => testConnection(conn.id)} disabled={testingId === conn.id} title="Test connection">
								{#if testingId === conn.id}<span class="spinner"></span>{:else if PlayIcon}<PlayIcon size={12} />{/if}
								{testingId === conn.id ? 'Testing…' : 'Test'}
							</button>
							<button class="action-btn edit-btn" onclick={() => openEditModal(conn)} title="Edit">
								{#if EditIcon}<EditIcon size={12} />{/if} Edit
							</button>
							<button class="action-btn delete-btn" onclick={() => (deletingId = conn.id)} title="Delete">
								{#if TrashIcon}<TrashIcon size={12} />{/if}
							</button>
						{/if}
					</div>
				</div>

				{#if testResults[conn.id]}
					{@const r = testResults[conn.id]}
					<div class="test-result-panel" class:result-success={r.success} class:result-error={!r.success}>
						<div class="result-indicator">
							{#if r.success}
								<svg viewBox="0 0 16 16" width="14" height="14" fill="none"><path d="M2.5 8.5l3.5 3.5 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
							{:else}
								<svg viewBox="0 0 16 16" width="14" height="14" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
							{/if}
						</div>
						<div class="result-body">
							<span class="result-title">
								{r.success ? 'Connection successful' : 'Connection failed'}
								{#if r.latency_ms}
									<span class="result-latency">· {r.latency_ms}ms</span>
								{/if}
							</span>
							<span class="result-msg">{r.message}</span>
						</div>
						<button class="result-dismiss" onclick={() => dismissResult(conn.id)} aria-label="Dismiss result">
							<svg viewBox="0 0 16 16" width="11" height="11" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
						</button>
					</div>
				{/if}
			{/each}
		{/if}
	</div>
</div>

<style>
	/* ── Page ─────────────────────────────────────────────────────────────── */
	.page {
		padding: 32px 36px 64px;
		max-width: 1100px;
		width: 100%;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 24px;
		box-sizing: border-box;
	}

	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		flex-wrap: wrap;
	}

	.page-header-left { display: flex; align-items: center; gap: 14px; }

	.page-icon {
		display: flex;
		align-items: center;
		color: #b39ddb;
		filter: drop-shadow(0 0 10px rgba(179, 157, 219, 0.5));
	}

	.page-title { font-size: 20px; font-weight: 700; color: var(--text-accent); margin: 0 0 2px; letter-spacing: -0.02em; }
	.page-sub   { font-size: 12.5px; color: var(--text-muted); margin: 0; }

	/* ── Stats ────────────────────────────────────────────────────────────── */
	.stats-bar { display: flex; gap: 12px; flex-wrap: wrap; }

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: 14px 24px;
		border-radius: 14px;
		background: var(--bg-base);
		border: 1px solid rgba(255, 255, 255, 0.06);
		box-shadow: -3px -3px 8px var(--shadow-light), 3px 3px 8px var(--shadow-dark);
		min-width: 88px;
	}

	.stat-val   { font-size: 22px; font-weight: 700; color: var(--text-accent); line-height: 1; }
	.stat-label { font-size: 10.5px; font-weight: 500; color: var(--text-muted); letter-spacing: 0.05em; text-transform: uppercase; }
	.stat-success  .stat-val { color: #00e676; }
	.stat-failed   .stat-val { color: #ff4d6d; }
	.stat-untested .stat-val { color: var(--text-muted); }

	/* ── Connection table ─────────────────────────────────────────────────── */
	.list-wrap {
		display: flex;
		flex-direction: column;
		border-radius: 16px;
		background: var(--bg-base);
		border: 1px solid rgba(255, 255, 255, 0.06);
		box-shadow: -4px -4px 12px var(--shadow-light), 4px 4px 12px var(--shadow-dark);
		overflow: hidden;
	}

	.table-head {
		display: grid;
		grid-template-columns: 1.6fr 1.8fr 120px 110px auto;
		gap: 12px;
		padding: 10px 20px;
		background: rgba(255, 255, 255, 0.025);
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
		font-size: 10.5px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.conn-row {
		display: grid;
		grid-template-columns: 1.6fr 1.8fr 120px 110px auto;
		gap: 12px;
		align-items: center;
		padding: 14px 20px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.04);
		transition: background 0.14s;
	}

	.conn-row:last-child { border-bottom: none; }
	.conn-row:hover { background: rgba(255, 255, 255, 0.018); }
	.conn-row.row-success { border-left: 2px solid #00e676; padding-left: 18px; }
	.conn-row.row-failed  { border-left: 2px solid #ff4d6d; padding-left: 18px; }

	.col-name  { display: flex; align-items: center; gap: 10px; min-width: 0; }
	.col-url   { min-width: 0; }
	.col-status { display: flex; align-items: center; gap: 6px; }
	.col-tested { display: flex; align-items: center; gap: 5px; }
	.col-actions { display: flex; align-items: center; gap: 6px; justify-content: flex-end; }

	.conn-icon  { flex-shrink: 0; display: flex; align-items: center; color: #b39ddb; }
	.conn-info  { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
	.conn-name  { font-size: 13.5px; font-weight: 600; color: var(--text-accent); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.conn-user  { font-size: 11.5px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; }
	.conn-url   { font-size: 12px; color: var(--text-muted); font-family: monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
	.tested-time { font-size: 12px; color: var(--text-muted); }
	.inline-icon { display: inline-flex; align-items: center; }
	.muted { opacity: 0.5; }

	/* ── Badge ────────────────────────────────────────────────────────────── */
	.badge {
		display: inline-flex; align-items: center; gap: 5px;
		padding: 3px 9px; border-radius: 20px;
		font-size: 11px; font-weight: 600; letter-spacing: 0.03em;
	}
	.badge-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
	.badge-success  { background: rgba(0,230,118,.12); color:#00e676; border:1px solid rgba(0,230,118,.25); }
	.badge-failed   { background: rgba(255,77,109,.12); color:#ff4d6d; border:1px solid rgba(255,77,109,.25); }
	.badge-untested { background: rgba(255,255,255,.06); color:var(--text-muted); border:1px solid rgba(255,255,255,.1); }
	.badge-success  .badge-dot { background:#00e676; box-shadow:0 0 5px #00e676; }
	.badge-failed   .badge-dot { background:#ff4d6d; }
	.badge-untested .badge-dot { background:var(--text-muted); }
	.error-hint { font-size:12px; color:#ff4d6d; cursor:help; opacity:.75; }

	/* ── Action buttons ───────────────────────────────────────────────────── */
	.action-btn {
		display: inline-flex; align-items: center; gap: 5px;
		padding: 5px 10px; border-radius: 8px;
		border: 1px solid rgba(255,255,255,.1);
		background: rgba(255,255,255,.04);
		color: var(--text-muted); font-size: 12px; font-weight: 500;
		cursor: pointer; white-space: nowrap;
		transition: background .14s, border-color .14s, color .14s;
	}
	.action-btn:disabled { opacity:.5; cursor:not-allowed; }
	.test-btn:hover:not(:disabled) { background:rgba(0,230,118,.1); border-color:rgba(0,230,118,.3); color:#00e676; }
	.edit-btn:hover  { background:rgba(179,157,219,.1); border-color:rgba(179,157,219,.3); color:#b39ddb; }
	.delete-btn { padding:5px 8px; }
	.delete-btn:hover { background:rgba(255,77,109,.1); border-color:rgba(255,77,109,.3); color:#ff4d6d; }

	.delete-confirm { display:flex; align-items:center; gap:6px; font-size:12px; color:#ff4d6d; font-weight:600; }
	.btn-sm { padding:3px 8px; border-radius:6px; border:1px solid; font-size:11px; font-weight:600; cursor:pointer; transition:background .12s; }
	.btn-danger  { background:rgba(255,77,109,.15); border-color:rgba(255,77,109,.4); color:#ff4d6d; }
	.btn-danger:hover { background:rgba(255,77,109,.25); }
	.btn-ghost-sm { background:rgba(255,255,255,.05); border-color:rgba(255,255,255,.12); color:var(--text-muted); }
	.btn-ghost-sm:hover { background:rgba(255,255,255,.1); }

	/* ── Skeleton ─────────────────────────────────────────────────────────── */
	.skeleton { opacity:.5; }
	.sk-icon,.sk-badge,.sk-btn { background:rgba(255,255,255,.07); border-radius:6px; animation:pulse 1.5s ease-in-out infinite; }
	.sk-icon  { width:32px; height:32px; border-radius:8px; flex-shrink:0; }
	.sk-badge { width:70px; height:24px; border-radius:12px; }
	.sk-btn   { width:52px; height:28px; border-radius:8px; }
	.sk-lines { display:flex; flex-direction:column; gap:6px; flex:1; }
	.sk-line  { height:10px; border-radius:5px; background:rgba(255,255,255,.07); animation:pulse 1.5s ease-in-out infinite; }
	.sk-w60 { width:60%; } .sk-w40 { width:40%; }
	.sk-actions { display:flex; gap:6px; }
	@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

	/* ── Empty / error ────────────────────────────────────────────────────── */
	.empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; padding:64px 24px; text-align:center; }
	.empty-icon  { color:#b39ddb; opacity:.5; margin-bottom:4px; }
	.error-icon  { font-size:40px; color:#ff4d6d; opacity:.7; }
	.empty-title { font-size:15px; font-weight:600; color:var(--text-accent); margin:0; }
	.empty-sub   { font-size:13px; color:var(--text-muted); margin:0; max-width:340px; }
	.empty-hint  { font-size:12px; color:var(--text-muted); opacity:.7; margin:0; }
	.empty-hint code { background:rgba(255,255,255,.07); padding:1px 5px; border-radius:4px; font-family:monospace; font-size:11px; }

	/* ── Shared buttons ───────────────────────────────────────────────────── */
	.btn {
		display:inline-flex; align-items:center; gap:7px;
		padding:9px 18px; border-radius:10px; border:1px solid;
		font-size:13px; font-weight:600; cursor:pointer; white-space:nowrap;
		transition:background .15s, border-color .15s, box-shadow .15s;
	}
	.btn:disabled { opacity:.5; cursor:not-allowed; }
	.btn-primary {
		background:rgba(179,157,219,.15); border-color:rgba(179,157,219,.35); color:#b39ddb;
	}
	.btn-primary:hover:not(:disabled) {
		background:rgba(179,157,219,.25); border-color:rgba(179,157,219,.6);
		box-shadow:0 0 18px rgba(179,157,219,.22);
	}
	.btn-ghost { background:rgba(255,255,255,.04); border-color:rgba(255,255,255,.1); color:var(--text-muted); }
	.btn-ghost:hover { background:rgba(255,255,255,.08); color:var(--text-primary); }
	.btn-icon { display:flex; align-items:center; }

	/* ── Spinner ──────────────────────────────────────────────────────────── */
	.spinner {
		width:12px; height:12px;
		border:2px solid rgba(0,230,118,.3); border-top-color:#00e676;
		border-radius:50%; animation:spin .7s linear infinite; flex-shrink:0;
	}
	@keyframes spin { to { transform:rotate(360deg); } }

	/* ══════════════════════════════════════════════════════════════════════
	   MODAL
	══════════════════════════════════════════════════════════════════════ */

	/* Overlay: full-screen, heavy blur, dark tint */
	.modal-overlay {
		position: fixed;
		inset: 0;
		z-index: 200;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
		background: rgba(0, 0, 0, 0.65);
		backdrop-filter: blur(14px) saturate(0.7);
		-webkit-backdrop-filter: blur(14px) saturate(0.7);
		animation: overlay-in 0.2s ease-out;
	}

	@keyframes overlay-in {
		from { opacity: 0; backdrop-filter: blur(0px); }
		to   { opacity: 1; backdrop-filter: blur(14px); }
	}

	/* Card */
	.modal-card {
		position: relative;
		width: 100%;
		max-width: 680px;
		background: var(--bg-base);
		border-radius: 22px;
		overflow: hidden;
		/* Gradient border via box-shadow + border trick */
		border: 1px solid rgba(179, 157, 219, 0.22);
		box-shadow:
			0 0 0 1px rgba(255, 255, 255, 0.04),
			0 24px 80px rgba(0, 0, 0, 0.55),
			0 0 60px rgba(179, 157, 219, 0.08),
			inset 0 1px 0 rgba(255, 255, 255, 0.06);
		animation: modal-in 0.26s cubic-bezier(0.34, 1.3, 0.64, 1);
	}

	@keyframes modal-in {
		from { opacity: 0; transform: scale(0.93) translateY(16px); }
		to   { opacity: 1; transform: scale(1) translateY(0); }
	}

	/* Decorative ambient glow orbs */
	.modal-orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(55px);
		pointer-events: none;
		opacity: 0.18;
	}
	.orb-1 {
		width: 260px; height: 260px;
		background: #b39ddb;
		top: -80px; right: -60px;
	}
	.orb-2 {
		width: 200px; height: 200px;
		background: #4fc3f7;
		bottom: -60px; left: -40px;
	}

	/* Header */
	.modal-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
		padding: 26px 28px 20px;
		position: relative;
		z-index: 1;
	}

	.modal-header-left {
		display: flex;
		align-items: flex-start;
		gap: 14px;
	}

	.modal-header-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px; height: 40px;
		border-radius: 12px;
		background: rgba(179, 157, 219, 0.12);
		border: 1px solid rgba(179, 157, 219, 0.25);
		color: #b39ddb;
		flex-shrink: 0;
		margin-top: 2px;
		box-shadow: 0 0 18px rgba(179, 157, 219, 0.18);
	}

	.modal-title {
		font-size: 17px;
		font-weight: 700;
		color: var(--text-accent);
		margin: 0 0 4px;
		letter-spacing: -0.02em;
	}

	.modal-subtitle {
		font-size: 12.5px;
		color: var(--text-muted);
		margin: 0;
		line-height: 1.5;
	}

	.close-btn {
		flex-shrink: 0;
		width: 32px; height: 32px;
		display: flex; align-items: center; justify-content: center;
		border-radius: 9px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(255, 255, 255, 0.04);
		color: var(--text-muted);
		cursor: pointer;
		transition: background .14s, color .14s, border-color .14s;
	}

	.close-btn:hover {
		background: rgba(255, 77, 109, 0.12);
		border-color: rgba(255, 77, 109, 0.3);
		color: #ff4d6d;
	}

	.modal-divider {
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent,
			rgba(179, 157, 219, 0.2) 20%,
			rgba(179, 157, 219, 0.35) 50%,
			rgba(179, 157, 219, 0.2) 80%,
			transparent
		);
		margin: 0 28px;
		position: relative;
		z-index: 1;
	}

	/* Form */
	.modal-form {
		padding: 24px 28px 0;
		display: flex;
		flex-direction: column;
		gap: 20px;
		position: relative;
		z-index: 1;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 7px;
	}

	.field-label {
		font-size: 12px;
		font-weight: 600;
		color: var(--text-muted);
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.req { color: #ff4d6d; }

	.field-hint {
		font-size: 11px;
		color: var(--text-muted);
		opacity: 0.6;
		line-height: 1.4;
	}

	.field-hint-inline {
		font-size: 10.5px;
		color: var(--text-muted);
		font-weight: 400;
		text-transform: none;
		letter-spacing: 0;
		margin-left: 2px;
	}

	.input {
		width: 100%;
		padding: 11px 14px;
		border-radius: 11px;
		border: 1px solid rgba(255, 255, 255, 0.09);
		background: rgba(255, 255, 255, 0.03);
		color: var(--text-primary);
		font-size: 13.5px;
		outline: none;
		transition: border-color .18s, box-shadow .18s, background .18s;
		box-sizing: border-box;
	}

	.input::placeholder { color: var(--text-muted); opacity: 0.4; }

	.input:focus {
		border-color: rgba(179, 157, 219, 0.55);
		background: rgba(179, 157, 219, 0.04);
		box-shadow:
			0 0 0 3px rgba(179, 157, 219, 0.1),
			0 0 18px rgba(179, 157, 219, 0.06);
	}

	.pass-wrap { position: relative; display: flex; align-items: center; }
	.pass-input { padding-right: 42px; }

	.eye-btn {
		position: absolute;
		right: 11px;
		display: flex; align-items: center;
		background: none; border: none;
		cursor: pointer;
		color: var(--text-muted);
		padding: 4px;
		border-radius: 5px;
		transition: color .12s;
	}
	.eye-btn:hover { color: var(--text-primary); }

	/* Footer */
	.modal-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 20px 28px 24px;
		border-top: 1px solid rgba(255, 255, 255, 0.05);
		margin-top: 4px;
	}

	.footer-note {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 11px;
		color: var(--text-muted);
		opacity: 0.6;
	}

	.footer-lock {
		display: flex;
		align-items: center;
		color: #b39ddb;
		opacity: 0.8;
	}

	.footer-actions {
		display: flex;
		gap: 10px;
		flex-shrink: 0;
	}

	.btn-spinner {
		width: 13px; height: 13px;
		border: 2px solid rgba(179, 157, 219, 0.3);
		border-top-color: #b39ddb;
		border-radius: 50%;
		animation: spin .7s linear infinite;
		flex-shrink: 0;
	}

	/* ── Toast ────────────────────────────────────────────────────────────── */
	.toast {
		position: fixed;
		bottom: 28px; left: 50%;
		transform: translateX(-50%);
		z-index: 300;
		display: flex; align-items: center; gap: 10px;
		padding: 11px 20px;
		border-radius: 12px; border: 1px solid;
		font-size: 13px; font-weight: 500;
		box-shadow: 0 8px 32px rgba(0,0,0,.4);
		animation: toast-in .22s ease-out;
		backdrop-filter: blur(12px);
		white-space: nowrap;
	}
	.toast-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
	.toast-success { background:rgba(0,230,118,.12); border-color:rgba(0,230,118,.3); color:#00e676; }
	.toast-success .toast-dot { background:#00e676; box-shadow:0 0 6px #00e676; }
	.toast-error { background:rgba(255,77,109,.12); border-color:rgba(255,77,109,.3); color:#ff4d6d; }
	.toast-error .toast-dot { background:#ff4d6d; }
	@keyframes toast-in {
		from { opacity:0; transform:translateX(-50%) translateY(12px); }
		to   { opacity:1; transform:translateX(-50%) translateY(0); }
	}

	/* ── Test result panel ────────────────────────────────────────────────── */
	.test-result-panel {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 13px 20px 13px 16px;
		border-bottom: 1px solid rgba(255,255,255,.04);
		animation: result-slide-in 0.22s cubic-bezier(0.22, 1, 0.36, 1);
		overflow: hidden;
	}

	@keyframes result-slide-in {
		from { opacity: 0; transform: translateY(-6px); }
		to   { opacity: 1; transform: translateY(0); }
	}

	.result-success {
		background: rgba(0,230,118,.05);
		border-left: 3px solid rgba(0,230,118,.6);
	}

	.result-error {
		background: rgba(255,77,109,.06);
		border-left: 3px solid rgba(255,77,109,.65);
	}

	.result-indicator {
		flex-shrink: 0;
		width: 28px; height: 28px;
		display: flex; align-items: center; justify-content: center;
		border-radius: 50%;
		margin-top: 1px;
	}

	.result-success .result-indicator { background: rgba(0,230,118,.15); color: #00e676; }
	.result-error   .result-indicator { background: rgba(255,77,109,.15); color: #ff4d6d; }

	.result-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}

	.result-title {
		font-size: 12.5px;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
	}

	.result-success .result-title { color: #00e676; }
	.result-error   .result-title { color: #ff4d6d; }

	.result-latency {
		font-size: 11.5px;
		font-weight: 400;
		color: var(--text-muted);
		opacity: 0.7;
	}

	.result-msg {
		font-size: 12.5px;
		color: var(--text-muted);
		line-height: 1.5;
		word-break: break-word;
	}

	.result-dismiss {
		flex-shrink: 0;
		width: 26px; height: 26px;
		display: flex; align-items: center; justify-content: center;
		border-radius: 7px;
		border: 1px solid rgba(255,255,255,.08);
		background: rgba(255,255,255,.04);
		color: var(--text-muted);
		cursor: pointer;
		opacity: 0.55;
		transition: opacity .14s, background .14s;
		margin-top: 1px;
	}

	.result-dismiss:hover { opacity: 1; background: rgba(255,255,255,.1); }

	.row-testing { opacity: 0.75; transition: opacity .2s; }

	/* ── Responsive ───────────────────────────────────────────────────────── */
	@media (max-width: 840px) {
		.page { padding: 20px 16px 48px; }
		.table-head { display: none; }
		.conn-row { grid-template-columns: 1fr; gap: 8px; padding: 14px 16px; }
		.col-actions { justify-content: flex-start; }
		.form-row { grid-template-columns: 1fr; }
		.modal-footer { flex-direction: column; align-items: flex-start; }
		.footer-actions { width: 100%; justify-content: flex-end; }
		.test-result-panel { padding: 12px 16px; }
	}
</style>
