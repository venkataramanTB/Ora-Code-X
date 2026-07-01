<script>
	/**
	 * @typedef {'fixed_length'|'delimited'} ParseType
	 * @typedef {{ name: string, file: File|null, parseType: ParseType|null, hasHeader: boolean }} Step1State
	 */

	/** @type {{ value: Step1State, onchange: (s: Step1State) => void }} */
	let { value, onchange } = $props();

	let dragging = $state(false);
	let fileInput = $state(/** @type {HTMLInputElement|null} */ (null));

	const ACCEPTED = ['.csv', '.txt', '.xls', '.xlsx'];

	/** @param {File} file */
	function applyFile(file) {
		const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
		if (!['csv', 'txt', 'xls', 'xlsx'].includes(ext)) return;
		/** @type {ParseType|null} */
		const autoParseType = (ext === 'csv' || ext === 'xls' || ext === 'xlsx') ? 'delimited' : null;
		onchange({ ...value, file, parseType: autoParseType });
	}

	/** @param {DragEvent} e */
	function onDrop(e) {
		e.preventDefault();
		dragging = false;
		const file = e.dataTransfer?.files?.[0];
		if (file) applyFile(file);
	}

	/** @param {Event} e */
	function onFileInput(e) {
		const file = /** @type {HTMLInputElement} */ (e.currentTarget).files?.[0];
		if (file) applyFile(file);
	}

	function clearFile() {
		onchange({ ...value, file: null, parseType: null });
		if (fileInput) fileInput.value = '';
	}

	/** @param {string} ext */
	function extBadgeColor(ext) {
		if (ext === 'csv') return '#00e676';
		if (ext === 'xls' || ext === 'xlsx') return '#f5a623';
		return '#4fc3f7';
	}

	const fileExt  = $derived(value.file?.name.split('.').pop()?.toLowerCase() ?? '');
	const isTxt    = $derived(fileExt === 'txt');
	const isExcel  = $derived(fileExt === 'xls' || fileExt === 'xlsx');
</script>

<div class="step">
	<!-- Parser name -->
	<div class="field">
		<label class="field-label" for="parser-name">
			Parser Name <span class="req">*</span>
		</label>
		<input
			id="parser-name"
			class="input"
			type="text"
			placeholder="e.g. Payroll Q1 File"
			value={value.name}
			oninput={e => onchange({ ...value, name: /** @type {HTMLInputElement} */(e.currentTarget).value })}
		/>
	</div>

	<!-- Drop zone -->
	<div class="field">
		<span class="field-label">File <span class="req">*</span></span>

		{#if value.file}
			<!-- File selected state -->
			<div class="file-selected">
				<span class="file-ext-badge" style="background: {extBadgeColor(fileExt)}22; color: {extBadgeColor(fileExt)}; border-color: {extBadgeColor(fileExt)}44">
					.{fileExt}
				</span>
				<span class="file-name">{value.file.name}</span>
				<span class="file-size">{(value.file.size / 1024).toFixed(1)} KB</span>
				<button class="clear-btn" onclick={clearFile} aria-label="Remove file">
					<svg viewBox="0 0 16 16" width="12" height="12" fill="none">
						<path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
					</svg>
				</button>
			</div>
		{:else}
			<!-- Drop zone -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="drop-zone"
				class:dragging
				ondragover={e => { e.preventDefault(); dragging = true; }}
				ondragleave={() => { dragging = false; }}
				ondrop={onDrop}
				onclick={() => fileInput?.click()}
				role="button"
				tabindex="0"
				aria-label="Upload file"
				onkeydown={e => e.key === 'Enter' && fileInput?.click()}
			>
				<svg class="upload-icon" viewBox="0 0 48 48" fill="none" width="40" height="40">
					<path d="M24 32V16M24 16l-7 7M24 16l7 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
					<path d="M8 36c0 2.2 1.8 4 4 4h24c2.2 0 4-1.8 4-4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
				</svg>
				<p class="drop-title">{dragging ? 'Release to upload' : 'Drop your file here'}</p>
				<p class="drop-sub">or <span class="browse-link">click to browse</span></p>
				<p class="drop-types">Accepts .csv, .txt, .xls, .xlsx</p>
			</div>
		{/if}

		<input
			bind:this={fileInput}
			type="file"
			accept={ACCEPTED.join(',')}
			onchange={onFileInput}
			class="hidden-input"
			tabindex="-1"
		/>
	</div>

	<!-- .txt parse type selector (only shown for .txt files) -->
	{#if isTxt}
		<div class="field">
			<label class="field-label" for="parse-type">
				File Type <span class="req">*</span>
			</label>
			<select
				id="parse-type"
				class="select"
				value={value.parseType ?? ''}
				onchange={e => onchange({ ...value, parseType: /** @type {HTMLSelectElement} */(e.currentTarget).value === 'fixed_length' ? 'fixed_length' : 'delimited' })}
			>
				<option value="" disabled>Choose file type…</option>
				<option value="delimited">Delimiter</option>
				<option value="fixed_length">Fixed Length</option>
			</select>
			<span class="field-hint">How are the columns separated in this file?</span>
		</div>
	{/if}

	<!-- First line has headers toggle — hidden for fixed-length since headers don't apply -->
	{#if !isTxt || value.parseType !== 'fixed_length'}
		<div class="field">
			<span class="field-label">First Line Has Headers?</span>
			<div class="toggle-row">
				{#each [true, false] as opt (opt)}
					<button
						type="button"
						class="toggle-btn"
						class:active={value.hasHeader === opt}
						onclick={() => onchange({ ...value, hasHeader: opt })}
					>
						{opt ? 'Yes' : 'No'}
					</button>
				{/each}
			</div>
			<span class="field-hint">
				{value.hasHeader
					? isExcel
						? 'Column names will be auto-detected from row 1 of the spreadsheet'
						: 'Column names will be auto-detected from the first row'
					: 'All rows will be treated as data — columns must be defined manually'}
			</span>
		</div>
	{/if}
</div>

<style>
	.step { display: flex; flex-direction: column; gap: 20px; }

	/* ── Field ── */
	.field { display: flex; flex-direction: column; gap: 7px; }
	.field-label {
		font-size: 11.5px; font-weight: 700; letter-spacing: 0.06em;
		text-transform: uppercase; color: var(--text-muted);
	}
	.req { color: #ff4d6d; }
	.field-hint { font-size: 11px; color: var(--text-muted); opacity: 0.6; }

	/* ── Name input ── */
	.input {
		width: 100%; padding: 11px 14px; border-radius: 11px;
		border: 1px solid rgba(255,255,255,0.09);
		background: rgba(255,255,255,0.03);
		color: var(--text-primary); font-size: 13.5px; outline: none;
		transition: border-color .18s, box-shadow .18s, background .18s;
		box-sizing: border-box;
	}
	.input::placeholder { color: var(--text-muted); opacity: 0.4; }
	.input:focus {
		border-color: rgba(255,77,109,0.55);
		background: rgba(255,77,109,0.04);
		box-shadow: 0 0 0 3px rgba(255,77,109,0.1);
	}

	/* ── Drop zone ── */
	.drop-zone {
		border: 1.5px dashed rgba(255,255,255,0.14);
		border-radius: 14px;
		padding: 36px 24px;
		display: flex; flex-direction: column; align-items: center; gap: 8px;
		cursor: pointer;
		transition: border-color .18s, background .18s;
		background: rgba(255,255,255,0.02);
		user-select: none;
	}
	.drop-zone:hover, .drop-zone.dragging {
		border-color: rgba(255,77,109,0.5);
		background: rgba(255,77,109,0.04);
	}
	.drop-zone.dragging { border-style: solid; }

	.upload-icon { color: var(--text-muted); opacity: 0.5; margin-bottom: 4px; }
	.drop-zone.dragging .upload-icon { opacity: 0.85; color: #ff4d6d; }

	.drop-title { font-size: 14px; font-weight: 600; color: var(--text-accent); margin: 0; }
	.drop-sub   { font-size: 13px; color: var(--text-muted); margin: 0; }
	.browse-link { color: #ff4d6d; font-weight: 600; }
	.drop-types { font-size: 11px; color: var(--text-muted); opacity: 0.5; margin: 0; }

	/* ── File selected ── */
	.file-selected {
		display: flex; align-items: center; gap: 10px;
		padding: 12px 16px; border-radius: 11px;
		border: 1px solid rgba(255,255,255,0.09);
		background: rgba(255,255,255,0.03);
	}
	.file-ext-badge {
		padding: 2px 8px; border-radius: 6px; border: 1px solid;
		font-size: 10.5px; font-weight: 700; letter-spacing: 0.04em;
		flex-shrink: 0;
	}
	.file-name { flex: 1; font-size: 13px; color: var(--text-primary); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.file-size { font-size: 11.5px; color: var(--text-muted); flex-shrink: 0; }
	.clear-btn {
		flex-shrink: 0; width: 26px; height: 26px;
		display: flex; align-items: center; justify-content: center;
		border-radius: 7px; border: 1px solid rgba(255,255,255,0.1);
		background: rgba(255,255,255,0.04); color: var(--text-muted);
		cursor: pointer; transition: background .14s, color .14s;
	}
	.clear-btn:hover { background: rgba(255,77,109,0.12); color: #ff4d6d; border-color: rgba(255,77,109,0.3); }

	/* ── Header toggle ── */
	.toggle-row { display: flex; gap: 8px; }
	.toggle-btn {
		min-width: 80px; padding: 10px 0; border-radius: 11px;
		border: 1px solid rgba(255,255,255,0.09);
		background: rgba(255,255,255,0.03);
		color: var(--text-muted); font-size: 13px; font-weight: 500;
		cursor: pointer; text-align: center;
		transition: background .14s, border-color .14s, color .14s;
	}
	.toggle-btn:hover { background: rgba(255,77,109,0.08); color: var(--text-primary); }
	.toggle-btn.active { background: rgba(255,77,109,0.12); border-color: rgba(255,77,109,0.4); color: #ff4d6d; font-weight: 600; }

	/* ── Select ── */
	.select {
		width: 100%; padding: 11px 14px; border-radius: 11px;
		border: 1px solid rgba(255,255,255,0.09);
		background: rgba(255,255,255,0.03);
		color: var(--text-primary); font-size: 13.5px; outline: none;
		cursor: pointer;
		transition: border-color .18s, box-shadow .18s;
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.35)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 14px center;
		padding-right: 38px;
	}
	.select:focus {
		border-color: rgba(255,77,109,0.55);
		box-shadow: 0 0 0 3px rgba(255,77,109,0.1);
	}
	.select option { background: #1a1e28; color: var(--text-primary); }

	.hidden-input { display: none; }
</style>
