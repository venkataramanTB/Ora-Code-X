<script>
	import { Moon, Sun, Check, Palette, X } from 'lucide-svelte';
	import { COLOR_MODES, VISUAL_STYLES } from '$lib/data/styles.js';
	import { currentColorId, currentStyleId, setColorMode, setVisualStyle } from '$lib/stores/theme.js';
	import { fly, fade } from 'svelte/transition';
	import { cubicOut, cubicInOut } from 'svelte/easing';

	let open       = $state(false);
	let triggerEl  = $state(null);
	let hoveredStyle = $state(null);

	function toggle() { open = !open; }
	function close()  { open = false; }

	function onWindowKeydown(e) {
		if (e.key === 'Escape') close();
	}

	function pickColor(id) {
		if ($currentColorId === id) return;
		if (!document.startViewTransition) { setColorMode(id); return; }
		document.documentElement.dataset.vtType = 'color';
		const vt = document.startViewTransition(() => setColorMode(id));
		vt.finished.finally(() => delete document.documentElement.dataset.vtType);
	}

	function commitStyle(id) {
		close();
		hoveredStyle = null;
		if ($currentStyleId === id) return;
		if (!document.startViewTransition) { setVisualStyle(id); return; }
		document.documentElement.dataset.vtType = 'style';
		const vt = document.startViewTransition(() => setVisualStyle(id));
		vt.finished.finally(() => delete document.documentElement.dataset.vtType);
	}

	// Live preview on hover — just set the attribute, no store/localStorage touch
	function previewStyle(id) {
		hoveredStyle = id;
		document.documentElement.setAttribute('data-style', id ?? $currentStyleId);
	}
	function clearPreview() {
		hoveredStyle = null;
		document.documentElement.setAttribute('data-style', $currentStyleId);
	}
</script>

<svelte:window onkeydown={onWindowKeydown} />

<!-- Trigger -->
<button
	bind:this={triggerEl}
	class="trigger"
	class:is-open={open}
	onclick={toggle}
	aria-label="Appearance settings"
	aria-expanded={open}
	aria-haspopup="dialog"
>
	<Palette size={16} strokeWidth={2} />
</button>

{#if open}
	<!-- Backdrop -->
	<div
		class="backdrop"
		role="presentation"
		onclick={close}
		transition:fade={{ duration: 220 }}
	></div>

	<!-- Panel -->
	<div
		class="panel"
		role="dialog"
		aria-label="Appearance settings"
		transition:fly={{ y: -12, duration: 320, easing: cubicOut }}
	>
		<!-- Panel header -->
		<div class="panel-head">
			<span class="panel-title">Appearance</span>
			<button class="close-btn" onclick={close} aria-label="Close">
				<X size={15} strokeWidth={2} />
			</button>
		</div>

		<!-- ── Color mode ──────────────────────────── -->
		<div class="section">
			<p class="section-label">Mode</p>
			<div class="mode-toggle">
				{#each Object.values(COLOR_MODES) as mode (mode.id)}
					<button
						class="mode-btn"
						class:is-active={$currentColorId === mode.id}
						onclick={() => pickColor(mode.id)}
					>
						<span class="mode-icon">
							{#if mode.id === 'dark'}<Moon size={14} strokeWidth={2} />
							{:else}<Sun size={14} strokeWidth={2} />
							{/if}
						</span>
						<span class="mode-label">{mode.name}</span>
						{#if $currentColorId === mode.id}
							<span class="mode-check"><Check size={11} strokeWidth={3} /></span>
						{/if}
					</button>
				{/each}
			</div>
		</div>

		<!-- ── Visual style ────────────────────────── -->
		<div class="section">
			<div class="style-header">
				<p class="section-label">Visual Style</p>
				{#if hoveredStyle && hoveredStyle !== $currentStyleId}
					<span class="preview-badge">Previewing</span>
				{/if}
			</div>

			<div class="style-grid">
				{#each Object.values(VISUAL_STYLES) as vs (vs.id)}
					{@const isActive   = $currentStyleId === vs.id}
					{@const isPreviewing = hoveredStyle === vs.id}
					<button
						class="style-card"
						class:is-active={isActive}
						class:is-previewing={isPreviewing && !isActive}
						onclick={() => commitStyle(vs.id)}
						onmouseenter={() => previewStyle(vs.id)}
						onmouseleave={clearPreview}
						title={vs.desc}
					>
						<!-- Mini app mockup -->
						<div class="mockup mockup-{vs.id}">
							<div class="m-topbar">
								<div class="m-logo"></div>
								<div class="m-nav">
									<div class="m-dot"></div>
									<div class="m-dot"></div>
									<div class="m-dot"></div>
								</div>
							</div>
							<div class="m-body">
								<div class="m-tile m-tile-hero"></div>
								<div class="m-tile m-tile-sm"></div>
								<div class="m-tile m-tile-sm"></div>
							</div>
						</div>

						<div class="style-info">
							<span class="style-name">{vs.name}</span>
							<span class="style-desc">{vs.desc}</span>
						</div>

						{#if isActive}
							<span class="active-mark">
								<Check size={10} strokeWidth={3} />
							</span>
						{/if}
					</button>
				{/each}
			</div>
		</div>

		<p class="hint">Hover a style to preview live · Click to apply</p>
	</div>
{/if}

<style>
	/* ── Trigger ──────────────────────────────────── */
	.trigger {
		background: none;
		border: none;
		cursor: pointer;
		padding: 7px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-muted);
		transition: color 0.15s, background 0.15s;
	}
	.trigger:hover,
	.trigger.is-open {
		color: var(--accent-primary);
		background: rgba(var(--accent-primary-rgb), 0.08);
	}

	/* ── Backdrop ─────────────────────────────────── */
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 190;
		background: rgba(0, 0, 0, 0.32);
		backdrop-filter: blur(2px);
	}

	/* ── Panel ────────────────────────────────────── */
	.panel {
		position: fixed;
		top: 80px;
		right: 16px;
		width: 420px;
		z-index: 200;
		background: var(--bg-base);
		border: 1px solid var(--border-subtle);
		border-radius: 20px;
		padding: 0;
		overflow: hidden;
		box-shadow:
			-12px -12px 28px var(--shadow-light),
			 12px  12px 28px var(--shadow-dark),
			 0 0 0 1px var(--border-subtle),
			 0 32px 64px rgba(0, 0, 0, 0.4);
	}

	/* ── Panel header ─────────────────────────────── */
	.panel-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 18px 12px;
		border-bottom: 1px solid var(--border-subtle);
	}

	.panel-title {
		font-size: 13px;
		font-weight: 700;
		color: var(--text-accent);
		letter-spacing: 0.01em;
	}

	.close-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 5px;
		border-radius: 8px;
		color: var(--text-muted);
		display: flex;
		align-items: center;
		transition: color 0.15s, background 0.15s;
	}
	.close-btn:hover {
		color: var(--text-accent);
		background: rgba(255, 255, 255, 0.06);
	}

	/* ── Sections ─────────────────────────────────── */
	.section {
		padding: 14px 18px;
	}
	.section + .section {
		border-top: 1px solid var(--border-subtle);
	}

	.section-label {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.10em;
		text-transform: uppercase;
		color: var(--text-muted);
		margin-bottom: 10px;
	}

	.style-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 10px;
	}
	.style-header .section-label { margin-bottom: 0; }

	.preview-badge {
		font-size: 10px;
		font-weight: 600;
		color: var(--accent-primary);
		background: rgba(var(--accent-primary-rgb), 0.1);
		border: 1px solid rgba(var(--accent-primary-rgb), 0.2);
		border-radius: 20px;
		padding: 2px 8px;
		letter-spacing: 0.04em;
		animation: pulse-badge 1.2s ease-in-out infinite;
	}

	@keyframes pulse-badge {
		0%, 100% { opacity: 1; }
		50%       { opacity: 0.6; }
	}

	/* ── Mode toggle ──────────────────────────────── */
	.mode-toggle {
		display: flex;
		gap: 8px;
	}

	.mode-btn {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 14px;
		border-radius: 12px;
		border: 1px solid transparent;
		background: rgba(255, 255, 255, 0.03);
		cursor: pointer;
		font-size: 13px;
		font-weight: 500;
		color: var(--text-muted);
		transition: background 0.15s, border-color 0.15s, color 0.15s;
		position: relative;
	}
	.mode-btn:hover {
		background: rgba(var(--accent-primary-rgb), 0.06);
		color: var(--text-primary);
		border-color: var(--border-subtle);
	}
	.mode-btn.is-active {
		background: rgba(var(--accent-primary-rgb), 0.10);
		border-color: rgba(var(--accent-primary-rgb), 0.28);
		color: var(--accent-primary);
	}

	.mode-icon { display: flex; align-items: center; flex-shrink: 0; }
	.mode-label { flex: 1; text-align: left; }
	.mode-check {
		display: flex;
		align-items: center;
		color: var(--accent-primary);
		flex-shrink: 0;
	}

	/* ── Style grid ───────────────────────────────── */
	.style-grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 8px;
	}

	.style-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 8px 6px 10px;
		border-radius: 14px;
		border: 1px solid transparent;
		background: rgba(255, 255, 255, 0.02);
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s, transform 0.15s;
		position: relative;
	}
	.style-card:hover {
		background: rgba(var(--accent-primary-rgb), 0.05);
		border-color: rgba(var(--accent-primary-rgb), 0.15);
		transform: translateY(-2px);
	}
	.style-card.is-active {
		background: rgba(var(--accent-primary-rgb), 0.09);
		border-color: rgba(var(--accent-primary-rgb), 0.35);
	}
	.style-card.is-previewing {
		background: rgba(var(--accent-primary-rgb), 0.06);
		border-color: rgba(var(--accent-primary-rgb), 0.22);
	}

	.style-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		width: 100%;
	}
	.style-name {
		font-size: 10px;
		font-weight: 700;
		color: var(--text-primary);
		text-align: center;
		letter-spacing: 0.01em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		width: 100%;
	}
	.style-card.is-active .style-name { color: var(--accent-primary); }

	.style-desc {
		font-size: 8.5px;
		color: var(--text-muted);
		text-align: center;
		line-height: 1.3;
		display: none; /* hidden at 5-col, shown in future if we go 2-col */
	}

	.active-mark {
		position: absolute;
		top: 6px;
		right: 6px;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--accent-primary);
		color: var(--bg-base);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	/* ── Hint line ────────────────────────────────── */
	.hint {
		font-size: 10px;
		color: var(--text-muted);
		text-align: center;
		padding: 8px 18px 14px;
		border-top: 1px solid var(--border-subtle);
		letter-spacing: 0.02em;
	}

	/* ════════════════════════════════════════════════
	   MINI APP MOCKUPS — pure CSS, no images
	   Each .mockup-{id} block renders a tiny version
	   of what that visual style looks like in the app
	   ════════════════════════════════════════════════ */
	.mockup {
		width: 64px;
		height: 52px;
		border-radius: 7px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		gap: 3px;
		padding: 4px;
		flex-shrink: 0;
	}

	.m-topbar {
		height: 10px;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 4px;
		flex-shrink: 0;
	}
	.m-logo { width: 12px; height: 5px; border-radius: 2px; }
	.m-nav { display: flex; gap: 2px; align-items: center; }
	.m-dot { width: 4px; height: 4px; border-radius: 50%; }

	.m-body {
		flex: 1;
		display: grid;
		grid-template-columns: 1.6fr 1fr 1fr;
		grid-template-rows: 1fr;
		gap: 2px;
	}
	.m-tile      { border-radius: 3px; }
	.m-tile-hero { grid-column: 1; border-radius: 4px; }
	.m-tile-sm   { border-radius: 3px; }

	/* ─ NEO mockup ─ */
	.mockup-neo {
		background: #13171f;
		box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04);
	}
	.mockup-neo .m-topbar {
		background: #1b2130;
		box-shadow: 0 1px 3px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04);
	}
	.mockup-neo .m-logo   { background: #00d4ff; opacity: 0.7; box-shadow: 0 0 4px #00d4ff88; }
	.mockup-neo .m-dot    { background: rgba(255,255,255,0.15); }
	.mockup-neo .m-tile {
		background: #13171f;
		box-shadow: -1px -1px 3px rgba(255,255,255,0.04), 1px 1px 3px rgba(0,0,0,0.5);
	}

	/* ─ MINIMAL mockup ─ */
	.mockup-minimal {
		background: #111418;
		border: 1px solid rgba(255,255,255,0.09);
	}
	.mockup-minimal .m-topbar {
		background: #1a1e28;
		border: 1px solid rgba(255,255,255,0.07);
		border-radius: 3px;
		box-shadow: 0 1px 3px rgba(0,0,0,0.15);
	}
	.mockup-minimal .m-logo { background: #4fc3f7; opacity: 0.8; }
	.mockup-minimal .m-dot  { background: rgba(255,255,255,0.12); border-radius: 2px; }
	.mockup-minimal .m-tile {
		background: #1a1e28;
		border: 1px solid rgba(255,255,255,0.07);
		border-radius: 2px;
		box-shadow: 0 1px 2px rgba(0,0,0,0.15);
	}

	/* ─ SKEU mockup ─ */
	.mockup-skeu {
		background: linear-gradient(145deg, #1a1d2c, #101422);
		box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
	}
	.mockup-skeu .m-topbar {
		background: linear-gradient(180deg, #252a3c, #1a1e30);
		box-shadow: 0 1px 0 rgba(255,255,255,0.07), 0 2px 4px rgba(0,0,0,0.5);
	}
	.mockup-skeu .m-logo { background: linear-gradient(135deg, #5fc8f4, #2a90d8); border-radius: 2px; }
	.mockup-skeu .m-dot  { background: rgba(255,255,255,0.18); }
	.mockup-skeu .m-tile {
		background: linear-gradient(145deg, #1e2438, #131826);
		box-shadow: -1px -1px 2px rgba(255,255,255,0.06), 1px 1px 3px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05);
	}

	/* ─ BRUTAL mockup ─ */
	.mockup-brutal {
		background: #080808;
		border: 1.5px solid var(--accent-primary);
		border-radius: 0;
		box-shadow: 2px 2px 0 var(--accent-primary);
	}
	.mockup-brutal .m-topbar {
		background: #111;
		border-radius: 0;
		border-bottom: 1.5px solid var(--accent-primary);
		height: 11px;
	}
	.mockup-brutal .m-logo { background: var(--accent-primary); border-radius: 0; width: 14px; height: 6px; }
	.mockup-brutal .m-dot  { background: rgba(255,255,255,0.25); border-radius: 0; width: 5px; height: 5px; }
	.mockup-brutal .m-tile {
		background: #0e0e0e;
		border-radius: 0;
		border: 1px solid var(--accent-primary);
		box-shadow: 1px 1px 0 var(--accent-primary);
	}

	/* ─ MAXIMAL mockup ─ */
	.mockup-maximal {
		background: #0f1320;
		border: 1px solid rgba(var(--accent-primary-rgb), 0.3);
		box-shadow: 0 0 8px rgba(var(--accent-primary-rgb), 0.15), inset 0 0 12px rgba(var(--accent-primary-rgb), 0.04);
	}
	.mockup-maximal .m-topbar {
		background: linear-gradient(90deg, #1a2040, color-mix(in srgb, #1a2040 80%, rgba(var(--accent-primary-rgb), 1) 20%));
		border: 1px solid rgba(var(--accent-primary-rgb), 0.25);
		box-shadow: 0 0 6px rgba(var(--accent-primary-rgb), 0.12);
	}
	.mockup-maximal .m-logo {
		background: linear-gradient(90deg, var(--accent-primary), color-mix(in srgb, var(--accent-primary) 50%, #fff 50%));
		opacity: 0.9;
		border-radius: 2px;
	}
	.mockup-maximal .m-dot  { background: rgba(var(--accent-primary-rgb), 0.4); }
	.mockup-maximal .m-tile {
		background: #151c30;
		border: 1px solid rgba(var(--accent-primary-rgb), 0.2);
		box-shadow: 0 0 6px rgba(var(--accent-primary-rgb), 0.08);
	}
	.mockup-maximal .m-tile-hero {
		background: linear-gradient(135deg, #1a2240, #0f1525);
		border-color: rgba(var(--accent-primary-rgb), 0.3);
		box-shadow: 0 0 10px rgba(var(--accent-primary-rgb), 0.1);
	}
</style>
