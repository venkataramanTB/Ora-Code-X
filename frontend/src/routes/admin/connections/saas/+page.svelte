<script>
	import { onMount } from 'svelte';
	import { useClerkContext } from 'svelte-clerk';
	import { ICON_MAP } from '$lib/data/icons.js';

	const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

	const { session } = useClerkContext();

	/** Returns fetch headers with a valid Clerk Bearer token. */
	async function authHeaders() {
		const token = await session?.getToken();
		return {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		};
	}

	// ── Icons ─────────────────────────────────────────────────────────────────
	const CloudIcon      = ICON_MAP['Cloud'];
	const PlusIcon       = ICON_MAP['Zap'];
	const TrashIcon      = ICON_MAP['Trash2'];
	const EditIcon       = ICON_MAP['RefreshCw'];
	const PlayIcon       = ICON_MAP['Play'];
	const EyeIcon        = ICON_MAP['BookOpen'];
	const EyeOffIcon     = ICON_MAP['EyeOff'];
	const NetworkIcon    = ICON_MAP['Network'];
	const ServerIcon     = ICON_MAP['Server'];
	const LockIcon       = ICON_MAP['Lock'];
	const HistoryIcon    = ICON_MAP['History'];

	// ── State ─────────────────────────────────────────────────────────────────
	/** @type {any[]} */
	let connections = $state([]);
	let loading     = $state(true);
	let fetchError  = $state('');
	let drawerOpen  = $state(false);
	let editingId   = $state(/** @type {string|null} */ (null));
	let showPass    = $state(false);
	let saving      = $state(false);
	let testingId   = $state(/** @type {string|null} */ (null));
	let deletingId  = $state(/** @type {string|null} */ (null));

	/** @type {{ text: string, type: 'success'|'error' } | null} */
	let toast = $state(null);
	let toastTimer = /** @type {ReturnType<typeof setTimeout>|null} */ (null);

	let form = $state({
		connection_name: '',
		username: '',
		password: '',
		instance_url: '',
	});

	// ── Derived stats ─────────────────────────────────────────────────────────
	const stats = $derived({
		total:    connections.length,
		success:  connections.filter(/** @param {any} c */ c => c.status === 'success').length,
		failed:   connections.filter(/** @param {any} c */ c => c.status === 'failed').length,
		untested: connections.filter(/** @param {any} c */ c => c.status === 'untested').length,
	});

	// ── Toast helper ──────────────────────────────────────────────────────────
	/** @param {string} text @param {'success'|'error'} type */
	function showToast(text, type = 'success') {
		if (toastTimer) clearTimeout(toastTimer);
		toast = { text, type };
		toastTimer = setTimeout(() => { toast = null; }, 4000);
	}

	// ── API helpers ───────────────────────────────────────────────────────────
	async function loadConnections() {
		loading = true;
		fetchError = '';
		try {
			const res = await fetch(`${API}/api/connections`, { headers: await authHeaders() });
			if (!res.ok) throw new Error(`Server error ${res.status}`);
			connections = await res.json();
		} catch (err) {
			fetchError = /** @type {Error} */ (err).message;
		} finally {
			loading = false;
		}
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
			const url     = editingId ? `${API}/api/connections/${editingId}` : `${API}/api/connections`;
			const method  = editingId ? 'PUT' : 'POST';
			const payload = { ...form };
			if (editingId && !payload.password) delete payload.password;

			const res = await fetch(url, {
				method,
				headers: await authHeaders(),
				body: JSON.stringify(payload),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error ?? `Server error ${res.status}`);

			if (editingId) {
				connections = connections.map(c => c.id === editingId ? data : c);
				showToast('Connection updated successfully');
			} else {
				connections = [data, ...connections];
				showToast('Connection created successfully');
			}
			closeDrawer();
		} catch (err) {
			showToast(/** @type {Error} */ (err).message, 'error');
		} finally {
			saving = false;
		}
	}

	/** @param {string} id */
	async function testConnection(id) {
		testingId = id;
		try {
			const res  = await fetch(`${API}/api/connections/${id}/test`, { method: 'POST', headers: await authHeaders() });
			const data = await res.json();
			if (!res.ok) throw new Error(data.error ?? 'Test failed');
			connections = connections.map(c => c.id === id ? data.connection : c);
			showToast(
				data.success
					? `Connected! ${data.latencyMs}ms response time`
					: `Test failed: ${data.message}`,
				data.success ? 'success' : 'error',
			);
		} catch (err) {
			showToast(/** @type {Error} */ (err).message, 'error');
		} finally {
			testingId = null;
		}
	}

	/** @param {string} id */
	async function deleteConnection(id) {
		try {
			const res  = await fetch(`${API}/api/connections/${id}`, { method: 'DELETE', headers: await authHeaders() });
			const data = await res.json();
			if (!res.ok) throw new Error(data.error ?? 'Delete failed');
			connections = connections.filter(c => c.id !== id);
			showToast('Connection deleted');
		} catch (err) {
			showToast(/** @type {Error} */ (err).message, 'error');
		} finally {
			deletingId = null;
		}
	}

	// ── Drawer helpers ────────────────────────────────────────────────────────
	function openNewDrawer() {
		editingId = null;
		form = { connection_name: '', username: '', password: '', instance_url: '' };
		showPass = false;
		drawerOpen = true;
	}

	/** @param {any} conn */
	function openEditDrawer(conn) {
		editingId = conn.id;
		form = {
			connection_name: conn.connection_name,
			username:        conn.username,
			password:        '',
			instance_url:    conn.instance_url,
		};
		showPass = false;
		drawerOpen = true;
	}

	function closeDrawer() {
		drawerOpen = false;
		editingId  = null;
	}

	// ── Utilities ─────────────────────────────────────────────────────────────
	/** @param {string} iso */
	function relativeTime(iso) {
		if (!iso) return '—';
		const diff = Date.now() - new Date(iso).getTime();
		const m = Math.floor(diff / 60_000);
		if (m < 1)   return 'just now';
		if (m < 60)  return `${m}m ago`;
		const h = Math.floor(m / 60);
		if (h < 24)  return `${h}h ago`;
		return `${Math.floor(h / 24)}d ago`;
	}

	onMount(loadConnections);
</script>

<svelte:head>
	<title>Oracle Cloud SaaS Connections — OraCodeX Studio</title>
</svelte:head>

<!-- ── Toast ────────────────────────────────────────────────────────────────── -->
{#if toast}
	<div class="toast toast-{toast.type}" role="alert">
		<span class="toast-dot"></span>
		{toast.text}
	</div>
{/if}

<!-- ── Drawer backdrop ───────────────────────────────────────────────────────── -->
{#if drawerOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="backdrop" onclick={closeDrawer}></div>
{/if}

<!-- ── Right-side drawer ──────────────────────────────────────────────────────── -->
<aside class="drawer" class:drawer-open={drawerOpen} aria-hidden={!drawerOpen}>
	<div class="drawer-header">
		<h2 class="drawer-title">
			{#if editingId}Edit Connection{:else}New Connection{/if}
		</h2>
		<button class="icon-btn" onclick={closeDrawer} aria-label="Close drawer">✕</button>
	</div>

	<form class="drawer-form" onsubmit={e => { e.preventDefault(); saveConnection(); }}>
		<label class="field">
			<span class="field-label">Connection Name <span class="req">*</span></span>
			<input
				class="input"
				type="text"
				placeholder="e.g. Production ERP"
				bind:value={form.connection_name}
				required
			/>
		</label>

		<label class="field">
			<span class="field-label">Instance URL <span class="req">*</span></span>
			<input
				class="input"
				type="url"
				placeholder="https://company.fa.us2.oraclecloud.com"
				bind:value={form.instance_url}
				required
			/>
			<span class="field-hint">Oracle Cloud Fusion instance base URL</span>
		</label>

		<label class="field">
			<span class="field-label">Username <span class="req">*</span></span>
			<input
				class="input"
				type="text"
				placeholder="oracle.user@company.com"
				bind:value={form.username}
				required
			/>
		</label>

		<label class="field">
			<span class="field-label">
				Password {#if editingId}<span class="field-hint-inline">(leave blank to keep current)</span>{:else}<span class="req">*</span>{/if}
			</span>
			<div class="pass-wrap">
				{#if showPass}
					<input class="input pass-input" type="text"     placeholder={editingId ? '••••••••' : 'Enter password'} bind:value={form.password} />
				{:else}
					<input class="input pass-input" type="password" placeholder={editingId ? '••••••••' : 'Enter password'} bind:value={form.password} />
				{/if}
				<button
					type="button"
					class="eye-btn"
					onclick={() => (showPass = !showPass)}
					aria-label={showPass ? 'Hide password' : 'Show password'}
				>
					{#if showPass && EyeOffIcon}
						<EyeOffIcon size={15} />
					{:else if EyeIcon}
						<EyeIcon size={15} />
					{/if}
				</button>
			</div>
			<span class="field-hint">Encrypted with AES-256-GCM before storage</span>
		</label>

		<div class="drawer-footer">
			<button type="button" class="btn btn-ghost" onclick={closeDrawer}>Cancel</button>
			<button type="submit" class="btn btn-primary" disabled={saving}>
				{saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Connection'}
			</button>
		</div>
	</form>
</aside>

<!-- ── Main page ──────────────────────────────────────────────────────────────── -->
<div class="page">

	<!-- Page header -->
	<div class="page-header">
		<div class="page-header-left">
			<span class="page-icon">
				{#if CloudIcon}<CloudIcon size={28} strokeWidth={1.4} />{/if}
			</span>
			<div>
				<h1 class="page-title">Oracle Cloud SaaS Connections</h1>
				<p class="page-sub">Manage credentials for Oracle Fusion Cloud environments</p>
			</div>
		</div>
		<button class="btn btn-primary" onclick={openNewDrawer}>
			{#if PlusIcon}<span class="btn-icon"><PlusIcon size={15} /></span>{/if}
			New Connection
		</button>
	</div>

	<!-- Stats bar -->
	<div class="stats-bar">
		<div class="stat">
			<span class="stat-val">{stats.total}</span>
			<span class="stat-label">Total</span>
		</div>
		<div class="stat stat-success">
			<span class="stat-val">{stats.success}</span>
			<span class="stat-label">Connected</span>
		</div>
		<div class="stat stat-failed">
			<span class="stat-val">{stats.failed}</span>
			<span class="stat-label">Failed</span>
		</div>
		<div class="stat stat-untested">
			<span class="stat-val">{stats.untested}</span>
			<span class="stat-label">Untested</span>
		</div>
	</div>

	<!-- Connection list -->
	<div class="list-wrap">

		{#if loading}
			<!-- Skeleton rows -->
			{#each { length: 3 } as _}
				<div class="conn-row skeleton">
					<div class="sk-icon"></div>
					<div class="sk-lines">
						<div class="sk-line sk-w60"></div>
						<div class="sk-line sk-w40"></div>
					</div>
					<div class="sk-badge"></div>
					<div class="sk-actions">
						<div class="sk-btn"></div>
						<div class="sk-btn"></div>
						<div class="sk-btn"></div>
					</div>
				</div>
			{/each}

		{:else if fetchError}
			<div class="empty-state">
				<div class="empty-icon error-icon">!</div>
				<p class="empty-title">Cannot reach backend</p>
				<p class="empty-sub">{fetchError}</p>
				<p class="empty-hint">Make sure the backend is running: <code>npm run dev</code> in <code>backend/</code></p>
				<button class="btn btn-ghost" onclick={loadConnections}>Retry</button>
			</div>

		{:else if connections.length === 0}
			<div class="empty-state">
				{#if NetworkIcon}<div class="empty-icon"><NetworkIcon size={40} strokeWidth={1.2} /></div>{/if}
				<p class="empty-title">No connections yet</p>
				<p class="empty-sub">Add your first Oracle Cloud SaaS connection to get started.</p>
				<button class="btn btn-primary" onclick={openNewDrawer}>
					{#if PlusIcon}<span class="btn-icon"><PlusIcon size={15} /></span>{/if}
					New Connection
				</button>
			</div>

		{:else}
			<!-- Table header -->
			<div class="table-head">
				<span class="col-name">Connection</span>
				<span class="col-url">Instance URL</span>
				<span class="col-status">Status</span>
				<span class="col-tested">Last Tested</span>
				<span class="col-actions">Actions</span>
			</div>

			{#each connections as conn (conn.id)}
				<div class="conn-row" class:row-success={conn.status === 'success'} class:row-failed={conn.status === 'failed'}>

					<!-- Icon + name + username -->
					<div class="col-name">
						<span class="conn-icon">
							{#if ServerIcon}<ServerIcon size={18} strokeWidth={1.4} />{/if}
						</span>
						<div class="conn-info">
							<span class="conn-name">{conn.connection_name}</span>
							<span class="conn-user">
								{#if LockIcon}<span class="inline-icon"><LockIcon size={11} /></span>{/if}
								{conn.username}
							</span>
						</div>
					</div>

					<!-- Instance URL -->
					<div class="col-url">
						<span class="conn-url" title={conn.instance_url}>{conn.instance_url}</span>
					</div>

					<!-- Status badge -->
					<div class="col-status">
						<span class="badge badge-{conn.status}">
							<span class="badge-dot"></span>
							{conn.status === 'success' ? 'Connected' : conn.status === 'failed' ? 'Failed' : 'Untested'}
						</span>
						{#if conn.status === 'failed' && conn.error_message}
							<span class="error-hint" title={conn.error_message}>ⓘ</span>
						{/if}
					</div>

					<!-- Last tested -->
					<div class="col-tested">
						{#if HistoryIcon}<span class="inline-icon muted"><HistoryIcon size={12} /></span>{/if}
						<span class="tested-time">{relativeTime(conn.last_tested_at)}</span>
					</div>

					<!-- Actions -->
					<div class="col-actions">
						{#if deletingId === conn.id}
							<!-- Inline delete confirmation -->
							<span class="delete-confirm">
								Delete?
								<button class="btn-sm btn-danger" onclick={() => deleteConnection(conn.id)}>Yes</button>
								<button class="btn-sm btn-ghost-sm" onclick={() => (deletingId = null)}>No</button>
							</span>
						{:else}
							<button
								class="action-btn test-btn"
								onclick={() => testConnection(conn.id)}
								disabled={testingId === conn.id}
								title="Test connection"
							>
								{#if testingId === conn.id}
									<span class="spinner"></span>
								{:else if PlayIcon}
									<PlayIcon size={13} />
								{/if}
								{testingId === conn.id ? 'Testing…' : 'Test'}
							</button>

							<button
								class="action-btn edit-btn"
								onclick={() => openEditDrawer(conn)}
								title="Edit connection"
							>
								{#if EditIcon}<EditIcon size={13} />{/if}
								Edit
							</button>

							<button
								class="action-btn delete-btn"
								onclick={() => (deletingId = conn.id)}
								title="Delete connection"
							>
								{#if TrashIcon}<TrashIcon size={13} />{/if}
							</button>
						{/if}
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	/* ── Page layout ──────────────────────────────────────────────────────── */
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

	/* ── Page header ──────────────────────────────────────────────────────── */
	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		flex-wrap: wrap;
	}

	.page-header-left {
		display: flex;
		align-items: center;
		gap: 14px;
	}

	.page-icon {
		display: flex;
		align-items: center;
		color: #b39ddb;
		filter: drop-shadow(0 0 10px rgba(179, 157, 219, 0.5));
	}

	.page-title {
		font-size: 20px;
		font-weight: 700;
		color: var(--text-accent);
		margin: 0 0 2px;
		letter-spacing: -0.02em;
	}

	.page-sub {
		font-size: 12.5px;
		color: var(--text-muted);
		margin: 0;
	}

	/* ── Stats bar ────────────────────────────────────────────────────────── */
	.stats-bar {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: 14px 24px;
		border-radius: 14px;
		background: var(--bg-base);
		border: 1px solid rgba(255, 255, 255, 0.06);
		box-shadow:
			-3px -3px 8px var(--shadow-light),
			 3px  3px 8px var(--shadow-dark);
		min-width: 88px;
	}

	.stat-val {
		font-size: 22px;
		font-weight: 700;
		color: var(--text-accent);
		line-height: 1;
	}

	.stat-label {
		font-size: 10.5px;
		font-weight: 500;
		color: var(--text-muted);
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.stat-success .stat-val { color: #00e676; }
	.stat-failed  .stat-val { color: #ff4d6d; }
	.stat-untested .stat-val { color: var(--text-muted); }

	/* ── List / Table ─────────────────────────────────────────────────────── */
	.list-wrap {
		display: flex;
		flex-direction: column;
		gap: 0;
		border-radius: 16px;
		background: var(--bg-base);
		border: 1px solid rgba(255, 255, 255, 0.06);
		box-shadow:
			-4px -4px 12px var(--shadow-light),
			 4px  4px 12px var(--shadow-dark);
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

	.conn-row:hover {
		background: rgba(255, 255, 255, 0.018);
	}

	.conn-row.row-success { border-left: 2px solid #00e676; padding-left: 18px; }
	.conn-row.row-failed  { border-left: 2px solid #ff4d6d; padding-left: 18px; }

	/* ── Column cells ─────────────────────────────────────────────────────── */
	.col-name {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
	}

	.conn-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		color: #b39ddb;
	}

	.conn-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.conn-name {
		font-size: 13.5px;
		font-weight: 600;
		color: var(--text-accent);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.conn-user {
		font-size: 11.5px;
		color: var(--text-muted);
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.col-url {
		min-width: 0;
	}

	.conn-url {
		font-size: 12px;
		color: var(--text-muted);
		font-family: 'JetBrains Mono', monospace;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		display: block;
	}

	.col-status {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.col-tested {
		display: flex;
		align-items: center;
		gap: 5px;
	}

	.tested-time {
		font-size: 12px;
		color: var(--text-muted);
	}

	.col-actions {
		display: flex;
		align-items: center;
		gap: 6px;
		justify-content: flex-end;
	}

	/* ── Status badge ─────────────────────────────────────────────────────── */
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 3px 9px;
		border-radius: 20px;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.03em;
	}

	.badge-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.badge-success  { background: rgba(0, 230, 118, 0.12); color: #00e676; border: 1px solid rgba(0, 230, 118, 0.25); }
	.badge-failed   { background: rgba(255, 77, 109, 0.12); color: #ff4d6d; border: 1px solid rgba(255, 77, 109, 0.25); }
	.badge-untested { background: rgba(255, 255, 255, 0.06); color: var(--text-muted); border: 1px solid rgba(255, 255, 255, 0.1); }

	.badge-success  .badge-dot { background: #00e676; box-shadow: 0 0 5px #00e676; }
	.badge-failed   .badge-dot { background: #ff4d6d; }
	.badge-untested .badge-dot { background: var(--text-muted); }

	.error-hint {
		font-size: 12px;
		color: #ff4d6d;
		cursor: help;
		opacity: 0.75;
	}

	/* ── Action buttons ───────────────────────────────────────────────────── */
	.action-btn {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 5px 10px;
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(255, 255, 255, 0.04);
		color: var(--text-muted);
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.14s, border-color 0.14s, color 0.14s;
		white-space: nowrap;
	}

	.action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

	.test-btn:hover:not(:disabled) {
		background: rgba(0, 230, 118, 0.1);
		border-color: rgba(0, 230, 118, 0.3);
		color: #00e676;
	}

	.edit-btn:hover {
		background: rgba(179, 157, 219, 0.1);
		border-color: rgba(179, 157, 219, 0.3);
		color: #b39ddb;
	}

	.delete-btn {
		padding: 5px 8px;
	}

	.delete-btn:hover {
		background: rgba(255, 77, 109, 0.1);
		border-color: rgba(255, 77, 109, 0.3);
		color: #ff4d6d;
	}

	/* ── Inline delete confirm ────────────────────────────────────────────── */
	.delete-confirm {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		color: #ff4d6d;
		font-weight: 600;
	}

	.btn-sm {
		padding: 3px 8px;
		border-radius: 6px;
		border: 1px solid;
		font-size: 11px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.12s;
	}

	.btn-danger {
		background: rgba(255, 77, 109, 0.15);
		border-color: rgba(255, 77, 109, 0.4);
		color: #ff4d6d;
	}

	.btn-danger:hover { background: rgba(255, 77, 109, 0.25); }

	.btn-ghost-sm {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.12);
		color: var(--text-muted);
	}

	.btn-ghost-sm:hover { background: rgba(255, 255, 255, 0.1); }

	/* ── Skeleton ─────────────────────────────────────────────────────────── */
	.skeleton { opacity: 0.5; }

	.sk-icon, .sk-badge, .sk-btn {
		background: rgba(255, 255, 255, 0.07);
		border-radius: 6px;
		animation: pulse 1.5s ease-in-out infinite;
	}

	.sk-icon  { width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0; }
	.sk-badge { width: 70px; height: 24px; border-radius: 12px; }
	.sk-btn   { width: 52px; height: 28px; border-radius: 8px; }

	.sk-lines { display: flex; flex-direction: column; gap: 6px; flex: 1; }

	.sk-line {
		height: 10px;
		border-radius: 5px;
		background: rgba(255, 255, 255, 0.07);
		animation: pulse 1.5s ease-in-out infinite;
	}

	.sk-w60 { width: 60%; }
	.sk-w40 { width: 40%; }

	.sk-actions { display: flex; gap: 6px; }

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50%       { opacity: 0.4; }
	}

	/* ── Empty / error state ──────────────────────────────────────────────── */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 64px 24px;
		text-align: center;
	}

	.empty-icon {
		color: #b39ddb;
		opacity: 0.5;
		margin-bottom: 4px;
	}

	.error-icon {
		font-size: 40px;
		color: #ff4d6d;
		opacity: 0.7;
	}

	.empty-title {
		font-size: 15px;
		font-weight: 600;
		color: var(--text-accent);
		margin: 0;
	}

	.empty-sub {
		font-size: 13px;
		color: var(--text-muted);
		margin: 0;
		max-width: 340px;
	}

	.empty-hint {
		font-size: 12px;
		color: var(--text-muted);
		opacity: 0.7;
		margin: 0;
	}

	.empty-hint code {
		background: rgba(255, 255, 255, 0.07);
		padding: 1px 5px;
		border-radius: 4px;
		font-family: monospace;
		font-size: 11px;
	}

	/* ── Buttons ──────────────────────────────────────────────────────────── */
	.btn {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		padding: 9px 18px;
		border-radius: 10px;
		border: 1px solid;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
		white-space: nowrap;
	}

	.btn:disabled { opacity: 0.5; cursor: not-allowed; }

	.btn-primary {
		background: rgba(179, 157, 219, 0.15);
		border-color: rgba(179, 157, 219, 0.35);
		color: #b39ddb;
	}

	.btn-primary:hover:not(:disabled) {
		background: rgba(179, 157, 219, 0.25);
		border-color: rgba(179, 157, 219, 0.6);
		box-shadow: 0 0 18px rgba(179, 157, 219, 0.2);
	}

	.btn-ghost {
		background: rgba(255, 255, 255, 0.04);
		border-color: rgba(255, 255, 255, 0.1);
		color: var(--text-muted);
	}

	.btn-ghost:hover {
		background: rgba(255, 255, 255, 0.08);
		color: var(--text-primary);
	}

	.btn-icon { display: flex; align-items: center; }

	/* ── Backdrop ─────────────────────────────────────────────────────────── */
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.45);
		backdrop-filter: blur(2px);
		z-index: 40;
	}

	/* ── Drawer ───────────────────────────────────────────────────────────── */
	.drawer {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		width: 420px;
		max-width: 96vw;
		z-index: 50;
		background: var(--bg-base);
		border-left: 1px solid rgba(255, 255, 255, 0.08);
		box-shadow: -8px 0 40px rgba(0, 0, 0, 0.4);
		display: flex;
		flex-direction: column;
		transform: translateX(100%);
		transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.drawer-open { transform: translateX(0); }

	.drawer-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px 24px 16px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.07);
		flex-shrink: 0;
	}

	.drawer-title {
		font-size: 16px;
		font-weight: 700;
		color: var(--text-accent);
		margin: 0;
	}

	.icon-btn {
		width: 30px; height: 30px;
		display: flex; align-items: center; justify-content: center;
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(255, 255, 255, 0.04);
		color: var(--text-muted);
		cursor: pointer;
		font-size: 14px;
		transition: background 0.12s, color 0.12s;
	}

	.icon-btn:hover { background: rgba(255, 255, 255, 0.1); color: var(--text-accent); }

	/* ── Drawer form ──────────────────────────────────────────────────────── */
	.drawer-form {
		flex: 1;
		overflow-y: auto;
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.field-label {
		font-size: 12.5px;
		font-weight: 600;
		color: var(--text-muted);
		letter-spacing: 0.03em;
	}

	.req { color: #ff4d6d; }

	.field-hint {
		font-size: 11px;
		color: var(--text-muted);
		opacity: 0.65;
	}

	.field-hint-inline {
		font-size: 11px;
		color: var(--text-muted);
		font-weight: 400;
		margin-left: 4px;
	}

	.input {
		width: 100%;
		padding: 10px 13px;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(255, 255, 255, 0.04);
		color: var(--text-primary);
		font-size: 13.5px;
		outline: none;
		transition: border-color 0.15s, box-shadow 0.15s;
		box-sizing: border-box;
	}

	.input::placeholder { color: var(--text-muted); opacity: 0.5; }

	.input:focus {
		border-color: rgba(179, 157, 219, 0.5);
		box-shadow: 0 0 0 3px rgba(179, 157, 219, 0.1);
	}

	/* ── Password row ─────────────────────────────────────────────────────── */
	.pass-wrap {
		position: relative;
		display: flex;
		align-items: center;
	}

	.pass-input { padding-right: 40px; }

	.eye-btn {
		position: absolute;
		right: 10px;
		display: flex;
		align-items: center;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-muted);
		padding: 4px;
		border-radius: 5px;
		transition: color 0.12s;
	}

	.eye-btn:hover { color: var(--text-primary); }

	/* ── Drawer footer ────────────────────────────────────────────────────── */
	.drawer-footer {
		display: flex;
		gap: 10px;
		justify-content: flex-end;
		padding-top: 8px;
		border-top: 1px solid rgba(255, 255, 255, 0.07);
		margin-top: auto;
	}

	/* ── Spinner ──────────────────────────────────────────────────────────── */
	.spinner {
		width: 12px; height: 12px;
		border: 2px solid rgba(0, 230, 118, 0.3);
		border-top-color: #00e676;
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
		flex-shrink: 0;
	}

	@keyframes spin { to { transform: rotate(360deg); } }

	/* ── Inline icon ──────────────────────────────────────────────────────── */
	.inline-icon {
		display: inline-flex;
		align-items: center;
		vertical-align: middle;
	}

	.muted { opacity: 0.5; }

	/* ── Toast ────────────────────────────────────────────────────────────── */
	.toast {
		position: fixed;
		bottom: 28px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 100;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 11px 20px;
		border-radius: 12px;
		border: 1px solid;
		font-size: 13px;
		font-weight: 500;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
		animation: toast-in 0.22s ease-out;
		backdrop-filter: blur(12px);
		white-space: nowrap;
	}

	.toast-dot {
		width: 7px; height: 7px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.toast-success {
		background: rgba(0, 230, 118, 0.12);
		border-color: rgba(0, 230, 118, 0.3);
		color: #00e676;
	}

	.toast-success .toast-dot { background: #00e676; box-shadow: 0 0 6px #00e676; }

	.toast-error {
		background: rgba(255, 77, 109, 0.12);
		border-color: rgba(255, 77, 109, 0.3);
		color: #ff4d6d;
	}

	.toast-error .toast-dot { background: #ff4d6d; }

	@keyframes toast-in {
		from { opacity: 0; transform: translateX(-50%) translateY(12px); }
		to   { opacity: 1; transform: translateX(-50%) translateY(0); }
	}

	/* ── Responsive ───────────────────────────────────────────────────────── */
	@media (max-width: 840px) {
		.page { padding: 20px 16px 48px; }

		.table-head { display: none; }

		.conn-row {
			grid-template-columns: 1fr;
			gap: 8px;
			padding: 14px 16px;
		}

		.col-url  { font-size: 11px; }
		.col-actions { justify-content: flex-start; }
	}
</style>
