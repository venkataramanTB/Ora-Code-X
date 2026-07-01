<script>
	/**
	 * @typedef {'fixed_length'|'delimited'} ParseType
	 * @typedef {{ name: string, data_type: string, position?: number, start_pos?: number, length?: number, trim?: boolean }} ColumnDef
	 * @typedef {{ parseType: ParseType, delimiterChar: string, customDelimiter: string, hasHeader: boolean, columns: ColumnDef[] }} Step2State
	 */

	const DATA_TYPES = ['String', 'Integer', 'Decimal', 'Date', 'Timestamp', 'Boolean'];
	const DELIMITERS = [
		{ label: 'Comma  ,',     value: ',' },
		{ label: 'Tab  \\t',     value: '\t' },
		{ label: 'Pipe  |',      value: '|' },
		{ label: 'Semicolon  ;', value: ';' },
		{ label: 'Custom',       value: '__custom__' },
	];

	/** @type {{ value: Step2State, onchange: (s: Step2State) => void }} */
	let { value, onchange } = $props();

	const isFixed     = $derived(value.parseType === 'fixed_length');
	const isCustomDel = $derived(value.delimiterChar === '__custom__');

	const totalChars = $derived(
		isFixed
			? value.columns.reduce((sum, c) => sum + (Number(c.length) || 0), 0)
			: 0
	);

	/** @returns {ColumnDef} */
	function emptyColumn() {
		return isFixed
			? { name: '', data_type: 'String', start_pos: 1, length: 1, trim: true }
			: { name: '', data_type: 'String', position: value.columns.length + 1 };
	}

	function addColumn() {
		onchange({ ...value, columns: [...value.columns, emptyColumn()] });
	}

	/** @param {number} i */
	function removeColumn(i) {
		const cols = value.columns.filter((_, idx) => idx !== i);
		// Recalculate position for delimited
		const recalc = isFixed ? cols : cols.map((c, idx) => ({ ...c, position: idx + 1 }));
		onchange({ ...value, columns: recalc });
	}

	/**
	 * @param {number} i
	 * @param {Partial<ColumnDef>} patch
	 */
	function patchColumn(i, patch) {
		const cols = value.columns.map((c, idx) => idx === i ? { ...c, ...patch } : c);
		onchange({ ...value, columns: cols });
	}
</script>

<div class="step">

	{#if !isFixed}
		<!-- ── Delimiter config ── -->
		<div class="section">
			<span class="section-label">Delimiter</span>
			<div class="delimiter-row">
				{#each DELIMITERS as d (d.value)}
					<button
						type="button"
						class="del-btn"
						class:active={value.delimiterChar === d.value}
						onclick={() => onchange({ ...value, delimiterChar: d.value, customDelimiter: value.customDelimiter })}
					>
						{d.label}
					</button>
				{/each}
			</div>
			{#if isCustomDel}
				<input
					class="input input-sm"
					type="text"
					maxlength="5"
					placeholder="Enter delimiter character"
					value={value.customDelimiter}
					oninput={e => onchange({ ...value, customDelimiter: /** @type {HTMLInputElement} */(e.currentTarget).value })}
				/>
			{/if}
		</div>

	{/if}

	<!-- ── Column builder ── -->
	<div class="section">
		<div class="col-header-row">
			<span class="section-label">
				Columns
				{#if isFixed && value.columns.length > 0}
					<span class="char-counter">{totalChars} chars total</span>
				{/if}
			</span>
			<button type="button" class="add-col-btn" onclick={addColumn}>
				<svg viewBox="0 0 16 16" width="12" height="12" fill="none">
					<path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
				</svg>
				Add Column
			</button>
		</div>

		{#if value.columns.length === 0}
			<p class="empty-cols">No columns yet — click "Add Column" to start defining the layout.</p>
		{:else}
			<!-- Table header -->
			<div class="col-grid col-grid-head" class:is-fixed={isFixed}>
				<span>Name</span>
				{#if isFixed}
					<span>Start Pos</span>
					<span>Length</span>
				{:else}
					<span>Position</span>
				{/if}
				<span>Data Type</span>
				{#if isFixed}<span>Trim</span>{/if}
				<span></span>
			</div>

			{#each value.columns as col, i (i)}
				<div class="col-grid col-grid-row" class:is-fixed={isFixed}>
					<!-- Name -->
					<input
						class="input input-sm"
						type="text"
						placeholder="Column name"
						value={col.name}
						oninput={e => patchColumn(i, { name: /** @type {HTMLInputElement} */(e.currentTarget).value })}
					/>

					{#if isFixed}
						<!-- Start pos -->
						<input
							class="input input-sm input-num"
							type="number"
							min="1"
							value={col.start_pos ?? 1}
							oninput={e => patchColumn(i, { start_pos: Number(/** @type {HTMLInputElement} */(e.currentTarget).value) })}
						/>
						<!-- Length -->
						<input
							class="input input-sm input-num"
							type="number"
							min="1"
							value={col.length ?? 1}
							oninput={e => patchColumn(i, { length: Number(/** @type {HTMLInputElement} */(e.currentTarget).value) })}
						/>
					{:else}
						<!-- Position (auto) -->
						<span class="pos-badge">{col.position}</span>
					{/if}

					<!-- Data type -->
					<select
						class="select select-sm"
						value={col.data_type}
						onchange={e => patchColumn(i, { data_type: /** @type {HTMLSelectElement} */(e.currentTarget).value })}
					>
						{#each DATA_TYPES as dt (dt)}
							<option value={dt}>{dt}</option>
						{/each}
					</select>

					{#if isFixed}
						<!-- Trim -->
						<label class="trim-wrap" title="Trim whitespace">
							<input
								type="checkbox"
								class="trim-check"
								checked={col.trim ?? true}
								onchange={e => patchColumn(i, { trim: /** @type {HTMLInputElement} */(e.currentTarget).checked })}
							/>
						</label>
					{/if}

					<!-- Delete -->
					<button type="button" class="del-col-btn" onclick={() => removeColumn(i)} aria-label="Remove column">
						<svg viewBox="0 0 16 16" width="11" height="11" fill="none">
							<path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
						</svg>
					</button>
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	.step { display: flex; flex-direction: column; gap: 20px; }

	.section { display: flex; flex-direction: column; gap: 10px; }

	.section-label {
		font-size: 11.5px; font-weight: 700; letter-spacing: 0.06em;
		text-transform: uppercase; color: var(--text-muted);
		display: flex; align-items: center; gap: 8px;
	}

	.char-counter {
		font-size: 10.5px; font-weight: 600;
		color: #4fc3f7; background: rgba(79,195,247,0.1);
		border: 1px solid rgba(79,195,247,0.2);
		border-radius: 10px; padding: 1px 8px;
		letter-spacing: 0.02em; text-transform: none;
	}

	/* ── Delimiter buttons ── */
	.delimiter-row { display: flex; flex-wrap: wrap; gap: 8px; }
	.del-btn {
		padding: 7px 14px; border-radius: 9px;
		border: 1px solid rgba(255,255,255,0.09);
		background: rgba(255,255,255,0.03);
		color: var(--text-muted); font-size: 12.5px; font-weight: 500;
		cursor: pointer; font-family: monospace;
		transition: background .14s, border-color .14s, color .14s;
	}
	.del-btn:hover { background: rgba(255,77,109,0.08); border-color: rgba(255,77,109,0.2); color: var(--text-primary); }
	.del-btn.active { background: rgba(255,77,109,0.12); border-color: rgba(255,77,109,0.4); color: #ff4d6d; font-weight: 600; }

	/* ── Column builder ── */
	.col-header-row { display: flex; align-items: center; justify-content: space-between; }
	.add-col-btn {
		display: inline-flex; align-items: center; gap: 6px;
		padding: 6px 13px; border-radius: 8px;
		border: 1px solid rgba(255,255,255,0.1);
		background: rgba(255,255,255,0.04);
		color: var(--text-muted); font-size: 12px; font-weight: 500;
		cursor: pointer; transition: background .14s, color .14s, border-color .14s;
	}
	.add-col-btn:hover { background: rgba(255,77,109,0.1); border-color: rgba(255,77,109,0.3); color: #ff4d6d; }

	.empty-cols {
		font-size: 12.5px; color: var(--text-muted); opacity: 0.6;
		padding: 20px; text-align: center;
		border: 1px dashed rgba(255,255,255,0.08); border-radius: 10px; margin: 0;
	}

	/* Col grid */
	.col-grid {
		display: grid;
		gap: 8px;
		align-items: center;
	}
	/* delimited: Name | Pos | DataType | Del */
	.col-grid:not(.is-fixed) { grid-template-columns: 1fr 60px 130px 28px; }
	/* fixed: Name | StartPos | Length | DataType | Trim | Del */
	.col-grid.is-fixed       { grid-template-columns: 1fr 80px 70px 130px 36px 28px; }

	.col-grid-head {
		padding: 0 4px;
		font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
		text-transform: uppercase; color: var(--text-muted);
	}
	.col-grid-row {
		padding: 4px;
		border-radius: 8px;
		transition: background .12s;
	}
	.col-grid-row:hover { background: rgba(255,255,255,0.02); }

	/* ── Inputs inside grid ── */
	.input {
		width: 100%; padding: 8px 10px; border-radius: 8px;
		border: 1px solid rgba(255,255,255,0.09);
		background: rgba(255,255,255,0.03);
		color: var(--text-primary); font-size: 13px; outline: none;
		transition: border-color .15s, background .15s;
		box-sizing: border-box;
	}
	.input::placeholder { color: var(--text-muted); opacity: 0.4; }
	.input:focus { border-color: rgba(255,77,109,0.5); background: rgba(255,77,109,0.04); box-shadow: 0 0 0 2px rgba(255,77,109,0.08); }
	.input-num { text-align: center; padding-left: 6px; padding-right: 6px; }
	.input-sm { padding: 8px 10px; font-size: 13px; }

	.select {
		width: 100%; padding: 8px 10px; border-radius: 8px;
		border: 1px solid rgba(255,255,255,0.09);
		background: rgba(255,255,255,0.03);
		color: var(--text-primary); font-size: 13px; outline: none;
		cursor: pointer; appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
		background-repeat: no-repeat; background-position: right 8px center;
		padding-right: 26px; box-sizing: border-box;
		transition: border-color .15s;
	}
	.select:focus { border-color: rgba(255,77,109,0.5); box-shadow: 0 0 0 2px rgba(255,77,109,0.08); }
	.select option { background: #1a1e28; }
	.select-sm { padding: 8px 10px; font-size: 13px; }

	.pos-badge {
		display: flex; align-items: center; justify-content: center;
		height: 34px; border-radius: 8px;
		background: rgba(255,255,255,0.04);
		border: 1px solid rgba(255,255,255,0.07);
		font-size: 12.5px; color: var(--text-muted); font-weight: 600;
	}

	/* ── Trim checkbox ── */
	.trim-wrap {
		display: flex; align-items: center; justify-content: center;
		height: 34px; cursor: pointer;
	}
	.trim-check {
		width: 16px; height: 16px; accent-color: #ff4d6d; cursor: pointer;
	}

	/* ── Delete column button ── */
	.del-col-btn {
		width: 28px; height: 28px; border-radius: 7px;
		border: 1px solid rgba(255,255,255,0.08);
		background: rgba(255,255,255,0.03);
		color: var(--text-muted); cursor: pointer;
		display: flex; align-items: center; justify-content: center;
		transition: background .13s, color .13s, border-color .13s;
	}
	.del-col-btn:hover { background: rgba(255,77,109,0.12); color: #ff4d6d; border-color: rgba(255,77,109,0.3); }
</style>
