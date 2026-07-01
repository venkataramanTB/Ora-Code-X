<script>
	import { useClerkContext } from 'svelte-clerk';
	import { apiUpload } from '$lib/api.js';
	import Step1Upload from './steps/Step1Upload.svelte';
	import Step2Layout from './steps/Step2Layout.svelte';

	/**
	 * @typedef {'fixed_length'|'delimited'} ParseType
	 * @typedef {{ name: string, data_type: string, position?: number, start_pos?: number, length?: number, trim?: boolean }} ColumnDef
	 */

	const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
	const { session, clerk } = useClerkContext();
	const auth = { session, signOut: () => clerk?.signOut() ?? Promise.resolve() };

	/** @type {{ onSave: (data: any) => Promise<void>, onClose: () => void }} */
	let { onSave, onClose } = $props();

	let step           = $state(1);
	let saving         = $state(false);
	let parsingHeaders = $state(false);
	let error          = $state('');

	// ── Step 1 state ──────────────────────────────────────────────────────────
	/** @type {{ name: string, file: File|null, parseType: ParseType|null, hasHeader: boolean }} */
	let step1 = $state({ name: '', file: null, parseType: null, hasHeader: true });

	// ── Step 2 state ──────────────────────────────────────────────────────────
	/** @type {{ parseType: ParseType, delimiterChar: string, customDelimiter: string, hasHeader: boolean, columns: ColumnDef[] }} */
	let step2 = $state({
		parseType: 'delimited',
		delimiterChar: ',',
		customDelimiter: '',
		hasHeader: true,
		columns: [],
	});

	// ── Validation ────────────────────────────────────────────────────────────
	const fileExt = $derived(step1.file?.name.split('.').pop()?.toLowerCase() ?? '');

	// Overlay step1 values — keeps step2 write-back clean with no reactive loops
	const step2Effective = $derived({
		...step2,
		parseType:  step1.parseType ?? step2.parseType,
		hasHeader:  step1.hasHeader,
	});

	const step1Valid = $derived(
		step1.name.trim().length > 0 &&
		step1.file !== null &&
		(fileExt === 'csv' || fileExt === 'xls' || fileExt === 'xlsx' ||
		 (fileExt === 'txt' && step1.parseType !== null))
	);

	const step2Valid = $derived(
		step2.columns.length > 0 &&
		step2.columns.every(c => c.name.trim().length > 0)
	);

	// ── Navigation ───────────────────────────────────────────────────────────
	async function goNext() {
		if (!step1Valid || parsingHeaders) return;

		// Reset columns so a fresh Next always reflects the current file
		step2 = { ...step2, columns: [] };
		error = '';

		if (step1.hasHeader && step1.file) {
			parsingHeaders = true;
			try {
				const fd = new FormData();
				fd.append('file', step1.file);
				fd.append('has_header', 'true');
				fd.append('parse_type', step1.parseType ?? 'delimited');
				if (step2.delimiterChar && step2.delimiterChar !== '__custom__') {
					fd.append('delimiter_char', step2.delimiterChar);
				}
				const res = await apiUpload(`${API}/api/parsers/parse-headers`, fd, auth);
				if (res.ok) {
					const data = await res.json();
					const isFixed = (step1.parseType ?? 'delimited') === 'fixed_length';
					if (data.columns?.length > 0) {
						step2 = {
							...step2,
							columns: data.columns.map(/** @param {any} c */ c =>
								isFixed
									? { name: c.name, data_type: 'String', start_pos: 1, length: 1, trim: true }
									: { name: c.name, data_type: 'String', position: c.position }
							),
						};
					}
					if (data.detected_delimiter) {
						step2 = { ...step2, delimiterChar: data.detected_delimiter };
					}
				}
			} catch {
				// Non-fatal — user can add columns manually in Step 2
			} finally {
				parsingHeaders = false;
			}
		}

		step = 2;
	}

	function goBack() { step = 1; error = ''; }

	function onKeydown(/** @type {KeyboardEvent} */ e) {
		if (e.key === 'Escape') onClose();
	}

	// ── Save ─────────────────────────────────────────────────────────────────
	async function handleSave() {
		if (!step2Valid || saving) return;
		saving = true;
		error  = '';

		const parseType = step2Effective.parseType;

		const resolvedDelimiter =
			parseType === 'fixed_length'
				? null
				: step2.delimiterChar === '__custom__'
					? step2.customDelimiter || ','
					: step2.delimiterChar;

		const payload = {
			name:              step1.name.trim(),
			original_filename: step1.file?.name ?? '',
			file_extension:    fileExt,
			parse_type:        parseType,
			delimiter_char:    resolvedDelimiter,
			has_header:        parseType === 'fixed_length' ? null : step1.hasHeader,
			columns:           step2.columns.map((c, idx) => ({
				name:      c.name.trim(),
				data_type: c.data_type,
				position:  parseType === 'delimited' ? idx + 1 : undefined,
				start_pos: parseType === 'fixed_length' ? c.start_pos : undefined,
				length:    parseType === 'fixed_length' ? c.length    : undefined,
				trim:      parseType === 'fixed_length' ? (c.trim ?? true) : undefined,
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

<!-- Overlay -->
<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="overlay" onclick={onClose}>
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="dialog" onclick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="dlg-title">

		<!-- Ambient orbs -->
		<span class="orb orb-1" aria-hidden="true"></span>
		<span class="orb orb-2" aria-hidden="true"></span>

		<!-- Header -->
		<div class="dlg-header">
			<div class="dlg-header-left">
				<span class="dlg-icon" aria-hidden="true">
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none">
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
						<polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</span>
				<div>
					<h2 class="dlg-title" id="dlg-title">New File Parser</h2>
					<p class="dlg-sub">
						{step === 1 ? 'Upload your file and choose its format' : 'Define the column layout for parsing'}
					</p>
				</div>
			</div>
			<button class="close-btn" onclick={onClose} aria-label="Close">
				<svg viewBox="0 0 16 16" fill="none" width="13" height="13">
					<path d="M2 2l12 12M14 2L2 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
				</svg>
			</button>
		</div>

		<!-- Stepper -->
		<div class="stepper" aria-label="Progress">
			{#each [{ n: 1, label: 'File Upload' }, { n: 2, label: 'Layout Details' }] as s (s.n)}
				<div class="step-item" class:active={step === s.n} class:done={step > s.n}>
					<div class="step-circle">
						{#if step > s.n}
							<svg viewBox="0 0 16 16" width="11" height="11" fill="none">
								<path d="M2.5 8.5l3.5 3.5 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						{:else}
							{s.n}
						{/if}
					</div>
					<span class="step-label">{s.label}</span>
				</div>
				{#if s.n < 2}
					<div class="step-line" class:done={step > 1}></div>
				{/if}
			{/each}
		</div>

		<div class="dlg-divider"></div>

		<!-- Body -->
		<div class="dlg-body">
			{#if step === 1}
				<Step1Upload value={step1} onchange={v => { step1 = v; }} />
			{:else}
				<Step2Layout value={step2Effective} onchange={v => { step2 = v; }} />
			{/if}
		</div>

		<!-- Error -->
		{#if error}
			<p class="error-msg">{error}</p>
		{/if}

		<!-- Footer -->
		<div class="dlg-footer">
			{#if step === 1}
				<button class="btn btn-ghost" onclick={onClose}>Cancel</button>
				<button class="btn btn-primary" onclick={goNext} disabled={!step1Valid || parsingHeaders}>
					{#if parsingHeaders}
						<span class="btn-spinner"></span>
						Parsing…
					{:else}
						Next
						<svg viewBox="0 0 20 20" fill="none" width="14" height="14">
							<path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					{/if}
				</button>
			{:else}
				<button class="btn btn-ghost" onclick={goBack}>← Back</button>
				<button class="btn btn-primary" onclick={handleSave} disabled={!step2Valid || saving}>
					{#if saving}<span class="btn-spinner"></span>{/if}
					{saving ? 'Saving…' : 'Save Parser'}
				</button>
			{/if}
		</div>
	</div>
</div>

<style>
	/* ── Overlay ── */
	.overlay {
		position: fixed; inset: 0; z-index: 200;
		display: flex; align-items: center; justify-content: center;
		padding: 24px;
		background: rgba(0,0,0,0.65);
		backdrop-filter: blur(14px) saturate(0.7);
		animation: overlay-in 0.2s ease-out;
	}
	@keyframes overlay-in {
		from { opacity: 0; }
		to   { opacity: 1; }
	}

	/* ── Dialog card ── */
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

	/* Ambient orbs */
	.orb { position: absolute; border-radius: 50%; filter: blur(55px); pointer-events: none; opacity: 0.14; }
	.orb-1 { width: 240px; height: 240px; background: #ff4d6d; top: -80px; right: -60px; }
	.orb-2 { width: 180px; height: 180px; background: #4fc3f7; bottom: -60px; left: -40px; }

	/* ── Dialog header ── */
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

	/* ── Stepper ── */
	.stepper {
		display: flex; align-items: center; gap: 0;
		padding: 0 26px 18px; position: relative; z-index: 1; flex-shrink: 0;
	}
	.step-item { display: flex; align-items: center; gap: 9px; flex-shrink: 0; }
	.step-circle {
		width: 28px; height: 28px; border-radius: 50%;
		display: flex; align-items: center; justify-content: center;
		font-size: 12px; font-weight: 700;
		border: 1.5px solid rgba(255,255,255,0.15);
		color: var(--text-muted); background: rgba(255,255,255,0.04);
		transition: background .2s, border-color .2s, color .2s;
		flex-shrink: 0;
	}
	.step-item.active .step-circle {
		background: rgba(255,77,109,0.15); border-color: rgba(255,77,109,0.5); color: #ff4d6d;
	}
	.step-item.done .step-circle {
		background: rgba(0,230,118,0.15); border-color: rgba(0,230,118,0.4); color: #00e676;
	}
	.step-label { font-size: 12.5px; font-weight: 600; color: var(--text-muted); white-space: nowrap; transition: color .2s; }
	.step-item.active .step-label { color: var(--text-primary); }
	.step-item.done  .step-label { color: #00e676; }

	.step-line {
		flex: 1; height: 1.5px; background: rgba(255,255,255,0.1);
		margin: 0 12px; transition: background .2s;
	}
	.step-line.done { background: rgba(0,230,118,0.35); }

	/* ── Divider ── */
	.dlg-divider {
		height: 1px; flex-shrink: 0;
		background: linear-gradient(90deg, transparent, rgba(255,77,109,0.2) 20%, rgba(255,77,109,0.35) 50%, rgba(255,77,109,0.2) 80%, transparent);
		margin: 0 26px;
	}

	/* ── Body ── */
	.dlg-body {
		padding: 22px 26px;
		overflow-y: auto; flex: 1;
		position: relative; z-index: 1;
	}
	.dlg-body::-webkit-scrollbar { width: 4px; }
	.dlg-body::-webkit-scrollbar-track { background: transparent; }
	.dlg-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

	/* ── Error ── */
	.error-msg {
		margin: 0 26px; padding: 10px 14px; border-radius: 10px;
		background: rgba(255,77,109,0.1); border: 1px solid rgba(255,77,109,0.3);
		color: #ff4d6d; font-size: 12.5px; flex-shrink: 0;
	}

	/* ── Footer ── */
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
