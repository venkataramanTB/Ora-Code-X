<script>
	/** @type {{ onUpload: (name: string, file: File) => Promise<void>, onClose: () => void }} */
	let { onUpload, onClose } = $props();

	let name    = $state('');
	let file    = $state(/** @type {File|null} */ (null));
	let dragging = $state(false);
	let uploading = $state(false);
	let error   = $state('');

	const canSubmit = $derived(name.trim().length > 0 && file !== null && !uploading);

	/** @param {File} f */
	function setFile(f) {
		const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
		if (ext !== 'xlsx' && ext !== 'xls') {
			error = 'Only .xlsx and .xls files are supported';
			file = null;
			return;
		}
		if (f.size > 20 * 1024 * 1024) {
			error = 'File must be ≤ 20 MB';
			file = null;
			return;
		}
		error = '';
		file = f;
		if (!name.trim()) name = f.name.replace(/\.(xlsx|xls)$/i, '');
	}

	/** @param {DragEvent} e */
	function onDrop(e) {
		e.preventDefault();
		dragging = false;
		const dropped = e.dataTransfer?.files?.[0];
		if (dropped) setFile(dropped);
	}

	/** @param {Event} e */
	function onFileInput(e) {
		const input = /** @type {HTMLInputElement} */ (e.currentTarget);
		const picked = input.files?.[0];
		if (picked) setFile(picked);
		input.value = '';
	}

	function formatSize(bytes) {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	async function handleSubmit() {
		if (!canSubmit) return;
		uploading = true;
		error = '';
		try {
			await onUpload(name.trim(), /** @type {File} */ (file));
		} catch (err) {
			error = /** @type {Error} */ (err).message;
			uploading = false;
		}
	}

	function onKeydown(/** @type {KeyboardEvent} */ e) {
		if (e.key === 'Escape') onClose();
	}
</script>

<svelte:window onkeydown={onKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="overlay" onclick={onClose}>
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="dialog" onclick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="fbdi-dlg-title">
		<span class="orb orb-1" aria-hidden="true"></span>
		<span class="orb orb-2" aria-hidden="true"></span>

		<!-- Header -->
		<div class="dlg-header">
			<div class="dlg-header-left">
				<span class="dlg-icon" aria-hidden="true">
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none">
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
						<polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
						<line x1="12" y1="18" x2="12" y2="12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
						<line x1="9" y1="15" x2="15" y2="15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
					</svg>
				</span>
				<div>
					<h2 class="dlg-title" id="fbdi-dlg-title">Upload FBDI Template</h2>
					<p class="dlg-sub">Excel file will be parsed to extract table columns and notes</p>
				</div>
			</div>
			<button class="close-btn" onclick={onClose} aria-label="Close">
				<svg viewBox="0 0 16 16" fill="none" width="13" height="13">
					<path d="M2 2l12 12M14 2L2 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
				</svg>
			</button>
		</div>

		<div class="dlg-divider"></div>

		<!-- Body -->
		<div class="dlg-body">
			<!-- Name field -->
			<div class="field">
				<label class="field-label" for="tpl-name">Template Name <span class="req">*</span></label>
				<input
					id="tpl-name"
					class="field-input"
					type="text"
					placeholder="e.g. AP Invoices FBDI"
					bind:value={name}
					disabled={uploading}
					maxlength={120}
				/>
			</div>

			<!-- Drop zone -->
			<div
				class="drop-zone"
				class:dragging
				class:has-file={file !== null}
				role="button"
				tabindex="0"
				aria-label="Drop Excel file here or click to browse"
				ondragover={e => { e.preventDefault(); dragging = true; }}
				ondragleave={() => { dragging = false; }}
				ondrop={onDrop}
				onclick={() => document.getElementById('fbdi-file-input')?.click()}
				onkeydown={e => { if (e.key === 'Enter' || e.key === ' ') document.getElementById('fbdi-file-input')?.click(); }}
			>
				<input
					id="fbdi-file-input"
					type="file"
					accept=".xlsx,.xls"
					style="display:none"
					onchange={onFileInput}
					disabled={uploading}
				/>

				{#if file}
					<div class="file-info">
						<span class="file-icon" aria-hidden="true">
							<svg viewBox="0 0 24 24" fill="none" width="28" height="28">
								<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
								<polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						</span>
						<div class="file-meta">
							<span class="file-name">{file.name}</span>
							<span class="file-size">{formatSize(file.size)}</span>
						</div>
						<button
							class="file-remove"
							onclick={e => { e.stopPropagation(); file = null; error = ''; }}
							aria-label="Remove file"
						>✕</button>
					</div>
				{:else}
					<span class="dz-icon" aria-hidden="true">
						<svg viewBox="0 0 24 24" fill="none" width="36" height="36">
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
							<polyline points="17 8 12 3 7 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
							<line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
						</svg>
					</span>
					<p class="dz-primary">Drag &amp; drop your FBDI Excel file here</p>
					<p class="dz-secondary">or <span class="dz-link">click to browse</span></p>
					<p class="dz-hint">.xlsx · .xls · max 20 MB</p>
				{/if}
			</div>

			{#if error}
				<p class="error-msg">{error}</p>
			{/if}
		</div>

		<!-- Footer -->
		<div class="dlg-footer">
			<button class="btn btn-ghost" onclick={onClose} disabled={uploading}>Cancel</button>
			<button class="btn btn-primary" onclick={handleSubmit} disabled={!canSubmit}>
				{#if uploading}
					<span class="spinner"></span>
					Uploading…
				{:else}
					<svg viewBox="0 0 20 20" fill="none" width="14" height="14">
						<path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
					Upload &amp; Parse
				{/if}
			</button>
		</div>
	</div>
</div>

<style>
	.overlay {
		position: fixed; inset: 0; z-index: 200;
		display: flex; align-items: center; justify-content: center; padding: 24px;
		background: rgba(0,0,0,0.65);
		backdrop-filter: blur(14px) saturate(0.7);
		animation: fade-in 0.2s ease-out;
	}
	@keyframes fade-in { from { opacity: 0; } }

	.dialog {
		position: relative; width: 100%; max-width: 560px;
		max-height: calc(100vh - 48px); overflow: hidden;
		display: flex; flex-direction: column;
		background: var(--bg-base);
		border-radius: 22px;
		border: 1px solid rgba(245, 166, 35, 0.2);
		box-shadow:
			0 0 0 1px rgba(255,255,255,0.04),
			0 28px 80px rgba(0,0,0,0.55),
			0 0 60px rgba(245,166,35,0.07),
			inset 0 1px 0 rgba(255,255,255,0.06);
		animation: pop-in 0.26s cubic-bezier(0.34,1.3,0.64,1);
	}
	@keyframes pop-in {
		from { opacity: 0; transform: scale(0.93) translateY(16px); }
	}

	.orb { position: absolute; border-radius: 50%; filter: blur(55px); pointer-events: none; opacity: 0.14; }
	.orb-1 { width: 220px; height: 220px; background: #f5a623; top: -80px; right: -60px; }
	.orb-2 { width: 160px; height: 160px; background: #00d4ff; bottom: -60px; left: -40px; }

	/* Header */
	.dlg-header {
		display: flex; align-items: flex-start; justify-content: space-between; gap: 14px;
		padding: 24px 26px 18px; flex-shrink: 0; position: relative; z-index: 1;
	}
	.dlg-header-left { display: flex; align-items: flex-start; gap: 12px; }
	.dlg-icon {
		width: 40px; height: 40px; flex-shrink: 0;
		display: flex; align-items: center; justify-content: center;
		border-radius: 12px; background: rgba(245,166,35,0.12); border: 1px solid rgba(245,166,35,0.25);
		color: #f5a623; margin-top: 2px; box-shadow: 0 0 18px rgba(245,166,35,0.15);
	}
	.dlg-title { font-size: 17px; font-weight: 700; color: var(--text-accent); margin: 0 0 4px; letter-spacing: -0.02em; }
	.dlg-sub   { font-size: 12px; color: var(--text-muted); margin: 0; }
	.close-btn {
		flex-shrink: 0; width: 32px; height: 32px;
		display: flex; align-items: center; justify-content: center;
		border-radius: 9px; border: 1px solid rgba(255,255,255,0.1);
		background: rgba(255,255,255,0.04); color: var(--text-muted); cursor: pointer;
		transition: background .14s, color .14s;
	}
	.close-btn:hover { background: rgba(245,166,35,0.12); color: #f5a623; }

	.dlg-divider {
		height: 1px; flex-shrink: 0; margin: 0 26px;
		background: linear-gradient(90deg, transparent, rgba(245,166,35,0.25) 50%, transparent);
	}

	/* Body */
	.dlg-body { padding: 22px 26px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; flex: 1; position: relative; z-index: 1; }

	/* Field */
	.field { display: flex; flex-direction: column; gap: 7px; }
	.field-label { font-size: 12px; font-weight: 600; color: var(--text-muted); letter-spacing: 0.06em; text-transform: uppercase; }
	.req { color: #f5a623; }
	.field-input {
		background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
		border-radius: 10px; padding: 10px 14px;
		color: var(--text-accent); font-size: 13.5px;
		transition: border-color .15s, box-shadow .15s;
		outline: none;
	}
	.field-input:focus { border-color: rgba(245,166,35,0.5); box-shadow: 0 0 0 3px rgba(245,166,35,0.1); }
	.field-input:disabled { opacity: 0.5; }
	.field-input::placeholder { color: var(--text-muted); opacity: 0.5; }

	/* Drop zone */
	.drop-zone {
		border: 2px dashed rgba(255,255,255,0.12);
		border-radius: 14px;
		padding: 36px 24px;
		display: flex; flex-direction: column; align-items: center; gap: 8px;
		cursor: pointer;
		transition: border-color .2s, background .2s;
		text-align: center;
	}
	.drop-zone:hover, .drop-zone.dragging {
		border-color: rgba(245,166,35,0.5);
		background: rgba(245,166,35,0.04);
	}
	.drop-zone.has-file {
		border-style: solid; border-color: rgba(245,166,35,0.4);
		background: rgba(245,166,35,0.06); padding: 20px 24px;
	}

	.dz-icon { color: var(--text-muted); opacity: 0.5; }
	.drop-zone:hover .dz-icon, .drop-zone.dragging .dz-icon { color: #f5a623; opacity: 1; }

	.dz-primary { font-size: 13.5px; font-weight: 600; color: var(--text-primary); margin: 0; }
	.dz-secondary { font-size: 12.5px; color: var(--text-muted); margin: 0; }
	.dz-link { color: #f5a623; text-decoration: underline; text-underline-offset: 2px; }
	.dz-hint { font-size: 11px; color: var(--text-muted); opacity: 0.55; margin: 0; }

	.file-info { display: flex; align-items: center; gap: 12px; width: 100%; }
	.file-icon { color: #f5a623; flex-shrink: 0; }
	.file-meta { flex: 1; display: flex; flex-direction: column; gap: 2px; text-align: left; min-width: 0; }
	.file-name { font-size: 13px; font-weight: 600; color: var(--text-accent); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.file-size { font-size: 11px; color: var(--text-muted); }
	.file-remove {
		flex-shrink: 0; width: 28px; height: 28px;
		display: flex; align-items: center; justify-content: center;
		border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);
		background: transparent; color: var(--text-muted); cursor: pointer; font-size: 12px;
		transition: background .15s, color .15s;
	}
	.file-remove:hover { background: rgba(255,77,109,0.15); color: #ff4d6d; border-color: rgba(255,77,109,0.3); }

	/* Error */
	.error-msg {
		margin: 0; padding: 10px 14px; border-radius: 10px;
		background: rgba(255,77,109,0.1); border: 1px solid rgba(255,77,109,0.3);
		color: #ff4d6d; font-size: 12.5px;
	}

	/* Footer */
	.dlg-footer {
		display: flex; align-items: center; justify-content: flex-end; gap: 10px;
		padding: 16px 26px 22px;
		border-top: 1px solid rgba(255,255,255,0.05);
		flex-shrink: 0; position: relative; z-index: 1;
	}
	.btn {
		display: inline-flex; align-items: center; gap: 7px;
		padding: 9px 18px; border-radius: 10px; border: 1px solid;
		font-size: 13px; font-weight: 600; cursor: pointer;
		transition: background .15s, border-color .15s, box-shadow .15s;
	}
	.btn:disabled { opacity: .45; cursor: not-allowed; }
	.btn-primary {
		background: rgba(245,166,35,0.15); border-color: rgba(245,166,35,0.35); color: #f5a623;
	}
	.btn-primary:hover:not(:disabled) {
		background: rgba(245,166,35,0.25); border-color: rgba(245,166,35,0.6);
		box-shadow: 0 0 18px rgba(245,166,35,0.2);
	}
	.btn-ghost { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.1); color: var(--text-muted); }
	.btn-ghost:hover:not(:disabled) { background: rgba(255,255,255,0.08); color: var(--text-primary); }

	.spinner {
		width: 13px; height: 13px;
		border: 2px solid rgba(245,166,35,0.3); border-top-color: #f5a623;
		border-radius: 50%; animation: spin .7s linear infinite;
	}
	@keyframes spin { to { transform: rotate(360deg); } }
</style>
