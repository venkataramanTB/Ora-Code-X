<script>
	import Step2Layout from './steps/Step2Layout.svelte';

	/**
	 * @typedef {'fixed_length'|'delimited'} ParseType
	 * @typedef {{ name: string, data_type: string, position?: number, start_pos?: number, length?: number, trim?: boolean }} ColumnDef
	 * @typedef {{
	 *   id: string, name: string, original_filename: string, file_extension: string,
	 *   parse_type: ParseType, delimiter_char: string|null, has_header: boolean|null,
	 *   columns: ColumnDef[]
	 * }} ParserRecord
	 */

	/** @type {{ parser: ParserRecord, onSave: (payload: any) => Promise<void>, onClose: () => void }} */
	let { parser, onSave, onClose } = $props();

	const isTxtOrigin = parser.file_extension === 'txt';

	let name   = $state(parser.name);
	let saving = $state(false);
	let error  = $state('');

	/** @type {{ parseType: ParseType, delimiterChar: string, customDelimiter: string, hasHeader: boolean, columns: ColumnDef[] }} */
	let layout = $state({
		parseType:       parser.parse_type,
		delimiterChar:   parser.delimiter_char ?? ',',
		customDelimiter: '',
		hasHeader:       parser.has_header ?? true,
		columns:         parser.columns.map(c => ({ ...c })),
	});

	const isFixed = $derived(layout.parseType === 'fixed_length');

	const valid = $derived(
		name.trim().length > 0 &&
		layout.columns.length > 0 &&
		layout.columns.every(c => c.name.trim().length > 0)
	);

	/** @param {ParseType} pt */
	function setParseType(pt) {
		if (pt === layout.parseType) return;
		layout = { ...layout, parseType: pt, columns: [] };
	}

	function onKeydown(/** @type {KeyboardEvent} */ e) {
		if (e.key === 'Escape') onClose();
	}

	async function handleSave() {
		if (!valid || saving) return;
		saving = true;
		error  = '';

		const payload = {
			name: name.trim(),
			parse_type: layout.parseType,
			delimiter_char: isFixed
				? null
				: (layout.delimiterChar === '__custom__' ? layout.customDelimiter || ',' : layout.delimiterChar),
			has_header: isFixed ? null : layout.hasHeader,
			columns: layout.columns.map((c, idx) => ({
				name:      c.name.trim(),
				data_type: c.data_type,
				position:  !isFixed ? idx + 1 : undefined,
				start_pos: isFixed  ? c.start_pos : undefined,
				length:    isFixed  ? c.length    : undefined,
				trim:      isFixed  ? (c.trim ?? true) : undefined,
			})),
		};

		try {
			await onSave(payload);
		} catch (err) {
			error = /** @type {Error} */ (err).message;
			saving = false;
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="overlay" onclick={onClose}>
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="dialog" onclick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="edit-dlg-title">

		<span class="orb orb-1" aria-hidden="true"></span>
		<span class="orb orb-2" aria-hidden="true"></span>

		<div class="dlg-header">
			<div class="dlg-header-left">
				<span class="dlg-icon" aria-hidden="true">
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none">
						<path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</span>
				<div>
					<h2 class="dlg-title" id="edit-dlg-title">Edit File Parser</h2>
					<p class="dlg-sub">Update the columns and layout details</p>
				</div>
			</div>
			<button class="close-btn" onclick={onClose} aria-label="Close">
				<svg viewBox="0 0 16 16" fill="none" width="13" height="13">
					<path d="M2 2l12 12M14 2L2 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
				</svg>
			</button>
		</div>

		<div class="dlg-divider"></div>

		<div class="dlg-body">
			<!-- Read-only file info -->
			<div class="field">
				<span class="field-label">File</span>
				<div class="file-info">
					<span class="file-ext-badge">.{parser.file_extension}</span>
					<span class="file-name">{parser.original_filename}</span>
				</div>
			</div>

			<!-- Name -->
			<div class="field">
				<label class="field-label" for="edit-parser-name">
					Parser Name <span class="req">*</span>
				</label>
				<input
					id="edit-parser-name"
					class="input"
					type="text"
					value={name}
					oninput={e => (name = /** @type {HTMLInputElement} */(e.currentTarget).value)}
				/>
			</div>

			<!-- Parse type — txt-origin parsers only -->
			{#if isTxtOrigin}
				<div class="field">
					<span class="field-label">File Type</span>
					<div class="toggle-row">
						<button type="button" class="toggle-btn" class:active={!isFixed} onclick={() => setParseType('delimited')}>
							Delimited
						</button>
						<button type="button" class="toggle-btn" class:active={isFixed} onclick={() => setParseType('fixed_length')}>
							Fixed Length
						</button>
					</div>
					<span class="field-hint">Switching this resets the column list below.</span>
				</div>
			{/if}

			<!-- Has header -->
			{#if !isFixed}
				<div class="field">
					<span class="field-label">First Line Has Headers?</span>
					<div class="toggle-row">
						{#each [true, false] as opt (opt)}
							<button
								type="button"
								class="toggle-btn"
								class:active={layout.hasHeader === opt}
								onclick={() => (layout = { ...layout, hasHeader: opt })}
							>
								{opt ? 'Yes' : 'No'}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Delimiter + columns -->
			<Step2Layout value={layout} onchange={v => (layout = v)} />
		</div>

		{#if error}
			<p class="error-msg">{error}</p>
		{/if}

		<div class="dlg-footer">
			<button class="btn btn-ghost" onclick={onClose}>Cancel</button>
			<button class="btn btn-primary" onclick={handleSave} disabled={!valid || saving}>
				{#if saving}<span class="btn-spinner"></span>{/if}
				{saving ? 'Saving…' : 'Save Changes'}
			</button>
		</div>
	</div>
</div>

<style>
	.overlay {
		position: fixed; inset: 0; z-index: 200;
		display: flex; align-items: center; justify-content: center;
		padding: 24px;
		background: rgba(0,0,0,0.65);
		backdrop-filter: blur(14px) saturate(0.7);
		animation: overlay-in 0.2s ease-out;
	}
	@keyframes overlay-in { from { opacity: 0; } to { opacity: 1; } }

	.dialog {
		position: relative; width: 100%; max-width: 640px;
		max-height: calc(100vh - 48px); overflow: hidden;
		display: flex; flex-direction: column;
		background: var(--bg-base);
		border-radius: 22px;
		border: 1px solid rgba(255,77,109,0.2);
		box-shadow:
			0 0 0 1px rgba(255,255,255,0.04),
			0 28px 80px rgba(0,0,0,0.55),
			0 0 60px rgba(255,77,109,0.07),
			inset 0 1px 0 rgba(255,255,255,0.06);
		animation: dialog-in 0.26s cubic-bezier(0.34,1.3,0.64,1);
	}
	@keyframes dialog-in {
		from { opacity: 0; transform: scale(0.93) translateY(16px); }
		to   { opacity: 1; transform: scale(1) translateY(0); }
	}

	.orb { position: absolute; border-radius: 50%; filter: blur(55px); pointer-events: none; opacity: 0.14; }
	.orb-1 { width: 240px; height: 240px; background: #ff4d6d; top: -80px; right: -60px; }
	.orb-2 { width: 180px; height: 180px; background: #4fc3f7; bottom: -60px; left: -40px; }

	.dlg-header {
		display: flex; align-items: flex-start; justify-content: space-between; gap: 14px;
		padding: 24px 26px 18px; position: relative; z-index: 1; flex-shrink: 0;
	}
	.dlg-header-left { display: flex; align-items: flex-start; gap: 12px; }
	.dlg-icon {
		width: 40px; height: 40px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
		border-radius: 12px; background: rgba(255,77,109,0.12); border: 1px solid rgba(255,77,109,0.25);
		color: #ff4d6d; margin-top: 2px; box-shadow: 0 0 18px rgba(255,77,109,0.15);
	}
	.dlg-title { font-size: 17px; font-weight: 700; color: var(--text-accent); margin: 0 0 4px; letter-spacing: -0.02em; }
	.dlg-sub   { font-size: 12.5px; color: var(--text-muted); margin: 0; }
	.close-btn {
		flex-shrink: 0; width: 32px; height: 32px;
		display: flex; align-items: center; justify-content: center;
		border-radius: 9px; border: 1px solid rgba(255,255,255,0.1);
		background: rgba(255,255,255,0.04); color: var(--text-muted); cursor: pointer;
		transition: background .14s, color .14s, border-color .14s;
	}
	.close-btn:hover { background: rgba(255,77,109,0.12); border-color: rgba(255,77,109,0.3); color: #ff4d6d; }

	.dlg-divider {
		height: 1px; flex-shrink: 0;
		background: linear-gradient(90deg, transparent, rgba(255,77,109,0.2) 20%, rgba(255,77,109,0.35) 50%, rgba(255,77,109,0.2) 80%, transparent);
		margin: 0 26px;
	}

	.dlg-body {
		padding: 22px 26px;
		overflow-y: auto; flex: 1;
		position: relative; z-index: 1;
		display: flex; flex-direction: column; gap: 20px;
	}
	.dlg-body::-webkit-scrollbar { width: 4px; }
	.dlg-body::-webkit-scrollbar-track { background: transparent; }
	.dlg-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

	.field { display: flex; flex-direction: column; gap: 7px; }
	.field-label {
		font-size: 11.5px; font-weight: 700; letter-spacing: 0.06em;
		text-transform: uppercase; color: var(--text-muted);
	}
	.req { color: #ff4d6d; }
	.field-hint { font-size: 11px; color: var(--text-muted); opacity: 0.6; }

	.file-info {
		display: flex; align-items: center; gap: 10px;
		padding: 12px 16px; border-radius: 11px;
		border: 1px solid rgba(255,255,255,0.09);
		background: rgba(255,255,255,0.03);
	}
	.file-ext-badge {
		padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.15);
		font-size: 10.5px; font-weight: 700; letter-spacing: 0.04em; font-family: monospace;
		color: var(--text-muted); flex-shrink: 0;
	}
	.file-name { font-size: 13px; color: var(--text-primary); font-weight: 500; font-family: monospace; }

	.input {
		width: 100%; padding: 11px 14px; border-radius: 11px;
		border: 1px solid rgba(255,255,255,0.09);
		background: rgba(255,255,255,0.03);
		color: var(--text-primary); font-size: 13.5px; outline: none;
		transition: border-color .18s, box-shadow .18s, background .18s;
		box-sizing: border-box;
	}
	.input:focus {
		border-color: rgba(255,77,109,0.55);
		background: rgba(255,77,109,0.04);
		box-shadow: 0 0 0 3px rgba(255,77,109,0.1);
	}

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

	.error-msg {
		margin: 0 26px; padding: 10px 14px; border-radius: 10px;
		background: rgba(255,77,109,0.1); border: 1px solid rgba(255,77,109,0.3);
		color: #ff4d6d; font-size: 12.5px; flex-shrink: 0;
	}

	.dlg-footer {
		display: flex; align-items: center; justify-content: flex-end; gap: 10px;
		padding: 16px 26px 22px;
		border-top: 1px solid rgba(255,255,255,0.05);
		flex-shrink: 0; position: relative; z-index: 1;
	}
	.btn {
		display: inline-flex; align-items: center; gap: 7px;
		padding: 9px 18px; border-radius: 10px; border: 1px solid;
		font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap;
		transition: background .15s, border-color .15s, box-shadow .15s;
	}
	.btn:disabled { opacity: .5; cursor: not-allowed; }
	.btn-primary {
		background: rgba(255,77,109,0.15); border-color: rgba(255,77,109,0.35); color: #ff4d6d;
	}
	.btn-primary:hover:not(:disabled) {
		background: rgba(255,77,109,0.25); border-color: rgba(255,77,109,0.6);
		box-shadow: 0 0 18px rgba(255,77,109,0.2);
	}
	.btn-ghost { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.1); color: var(--text-muted); }
	.btn-ghost:hover { background: rgba(255,255,255,0.08); color: var(--text-primary); }

	.btn-spinner {
		width: 13px; height: 13px;
		border: 2px solid rgba(255,77,109,0.3); border-top-color: #ff4d6d;
		border-radius: 50%; animation: spin .7s linear infinite; flex-shrink: 0;
	}
	@keyframes spin { to { transform: rotate(360deg); } }
</style>
