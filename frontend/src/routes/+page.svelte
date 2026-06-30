<script>
	import { goto } from '$app/navigation';
	import { sidebarOpen, pendingExpand } from '$lib/stores/navigation.js';
	import { NAV_ITEMS } from '$lib/data/nav.js';
	import { ICON_MAP } from '$lib/data/icons.js';

	const MenuIcon = ICON_MAP['Menu'];

	function openMenu() {
		sidebarOpen.set(true);
	}

	/** Navigate directly for leaf items; open + expand sidebar for items with children. */
	function openSection(item) {
		if (!item.children?.length) {
			goto(item.href ?? `/${item.id}`);
		} else {
			pendingExpand.set(item.id);
			sidebarOpen.set(true);
		}
	}

	/** @param {string} text @returns {{ t: 'text'|'x', v?: string }[]} */
	function splitLabel(text) {
		const segments = [];
		const re = /X(?=[a-z]|ion|ing|$)/g;
		let last = 0, match;
		while ((match = re.exec(text)) !== null) {
			if (match.index > last) segments.push({ t: 'text', v: text.slice(last, match.index) });
			segments.push({ t: 'x' });
			last = match.index + 1;
		}
		if (last < text.length) segments.push({ t: 'text', v: text.slice(last) });
		return segments;
	}
</script>

<svelte:head>
	<title>OraCodeX Studio</title>
	<meta name="description" content="The Intelligent Oracle Cloud Delivery Platform" />
</svelte:head>

<div class="welcome">

	<!-- ── Hero ─────────────────────────────────────────── -->
	<section class="hero">
		<p class="eyebrow">Welcome to</p>

		<h1 class="hero-title">
			OraCode<span class="x-char hero-x">X</span>
			<br />
			<span class="hero-studio">Studio</span>
		</h1>

		<p class="hero-sub">
			The Intelligent Oracle Cloud Delivery Platform
		</p>

		<button class="cta" onclick={openMenu}>
			<span class="cta-menu-icon"><MenuIcon size={15} /></span>
			<span class="cta-text">Open Menu</span>
			<span class="cta-arrow" aria-hidden="true">
				<svg viewBox="0 0 20 20" fill="none" class="arrow-svg">
					<path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</span>
		</button>
	</section>

	<!-- ── Feature cards ─────────────────────────────────── -->
	<div class="feature-grid">
		{#each NAV_ITEMS as item (item.id)}
			{@const Icon = ICON_MAP[item.iconName]}
			<button
				class="feature-card"
				style="--acc:{item.accent}"
				onclick={() => openSection(item)}
				title={item.label}
			>
				<span class="fc-glow" style="background:{item.accent}"></span>

				{#if Icon}
					<span class="fc-icon" style:color={item.accent}>
						<Icon size={22} strokeWidth={1.5} />
					</span>
				{/if}

				<span class="fc-label">{#each splitLabel(item.label) as seg}{#if seg.t === 'x'}<span class="x-char">X</span>{:else}{seg.v}{/if}{/each}</span>

				{#if item.children?.length}
					<span class="fc-badge" style="color:{item.accent};border-color:{item.accent}33">
						{item.children.length}
					</span>
				{/if}
			</button>
		{/each}
	</div>

	<!-- ── Ambient decorative orbs ─────────────────────── -->
	<div class="ambient" aria-hidden="true">
		<span class="a-orb" style="--c:#00d4ff;  left:8%;  top:18%; width:320px; height:320px; animation-delay:0s"></span>
		<span class="a-orb" style="--c:#f5a623;  left:78%; top:22%; width:260px; height:260px; animation-delay:1.4s"></span>
		<span class="a-orb" style="--c:#b39ddb;  left:58%; top:68%; width:280px; height:280px; animation-delay:2.8s"></span>
		<span class="a-orb" style="--c:#00e676;  left:18%; top:72%; width:220px; height:220px; animation-delay:0.7s"></span>
	</div>
</div>

<style>
	/* ── Page shell — full width, two-row grid ─────────── */
	.welcome {
		position: relative;
		width: 100%;
		min-height: calc(100dvh - 120px);
		display: grid;
		grid-template-rows: 1fr auto;
		overflow: hidden;
	}

	/* ── Ambient orbs ────────────────────────────────────── */
	.ambient { position: absolute; inset: 0; pointer-events: none; z-index: 0; }

	.a-orb {
		position: absolute;
		border-radius: 50%;
		background: var(--c);
		opacity: 0.045;
		filter: blur(70px);
		animation: orb-drift 14s ease-in-out infinite alternate;
	}

	@keyframes orb-drift {
		from { transform: translate(0, 0) scale(1); }
		to   { transform: translate(24px, -24px) scale(1.1); }
	}

	/* ── Hero ────────────────────────────────────────────── */
	.hero {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 20px;
		padding: 32px 24px 40px;
		position: relative;
		z-index: 1;
	}

	.eyebrow {
		font-size: 12px;
		font-weight: 500;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: var(--text-muted);
		margin: 0;
	}

	.hero-title {
		font-size: clamp(52px, 9vw, 96px);
		font-weight: 800;
		line-height: 0.95;
		letter-spacing: -0.04em;
		color: var(--text-accent);
		margin: 0;
	}

	.hero-studio {
		font-size: clamp(36px, 6vw, 68px);
		font-weight: 300;
		color: var(--text-muted);
		letter-spacing: -0.01em;
	}

	.hero-sub {
		font-size: clamp(13px, 1.6vw, 15px);
		color: var(--text-muted);
		line-height: 1.6;
		margin: 0;
		opacity: 0.75;
	}

	/* ── CTA ─────────────────────────────────────────────── */
	.cta {
		display: inline-flex;
		align-items: center;
		gap: 9px;
		padding: 11px 22px 11px 16px;
		margin-top: 4px;
		border-radius: 14px;
		border: 1px solid rgba(var(--accent-primary-rgb), 0.28);
		background: rgba(var(--accent-primary-rgb), 0.08);
		color: var(--accent-primary);
		cursor: pointer;
		font-size: 13.5px;
		font-weight: 600;
		letter-spacing: 0.03em;
		transition: background 0.18s, border-color 0.18s, box-shadow 0.18s;
	}

	.cta:hover {
		background: rgba(var(--accent-primary-rgb), 0.15);
		border-color: rgba(var(--accent-primary-rgb), 0.5);
		box-shadow: 0 0 24px rgba(var(--accent-primary-rgb), 0.22);
	}

	.cta-menu-icon { display: flex; align-items: center; opacity: 0.8; }
	.cta-text      { line-height: 1; }

	.cta-arrow { display: flex; align-items: center; margin-left: 2px; }

	.arrow-svg {
		width: 18px; height: 18px;
		animation: arrow-slide 1.6s ease-in-out infinite;
	}

	@keyframes arrow-slide {
		0%, 100% { transform: translateX(0);  opacity: 1;   }
		45%       { transform: translateX(5px); opacity: 0.4; }
	}

	/* ── Feature grid — 6 columns, full width ───────────── */
	.feature-grid {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 12px;
		padding: 0 24px 40px;
		position: relative;
		z-index: 1;
	}

	@media (max-width: 900px) {
		.feature-grid { grid-template-columns: repeat(3, 1fr); }
	}

	@media (max-width: 540px) {
		.feature-grid { grid-template-columns: repeat(2, 1fr); }
	}

	.feature-card {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 20px 12px 18px;
		border-radius: 16px;
		border: 1px solid rgba(var(--accent-primary-rgb), 0.08);
		background: var(--bg-base);
		cursor: pointer;
		overflow: hidden;
		transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
		box-shadow:
			-4px -4px 10px var(--shadow-light),
			 4px  4px 10px var(--shadow-dark);
		width: 100%;
		text-align: center;
	}

	.feature-card:hover {
		border-color: color-mix(in srgb, var(--acc) 40%, transparent);
		box-shadow:
			-4px -4px 10px var(--shadow-light),
			 4px  4px 10px var(--shadow-dark),
			0 0 20px color-mix(in srgb, var(--acc) 18%, transparent);
		transform: translateY(-3px);
	}

	.fc-glow {
		position: absolute;
		inset: 0;
		opacity: 0;
		transition: opacity 0.25s;
		pointer-events: none;
		filter: blur(30px);
	}

	.feature-card:hover .fc-glow { opacity: 0.07; }

	.fc-icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		position: relative;
		z-index: 1;
		transition: filter 0.2s, transform 0.2s;
	}

	.feature-card:hover .fc-icon {
		filter: drop-shadow(0 0 8px var(--acc));
		transform: scale(1.12);
	}

	.fc-label {
		font-size: 11.5px;
		font-weight: 600;
		color: var(--text-muted);
		position: relative;
		z-index: 1;
		transition: color 0.2s;
		letter-spacing: 0.01em;
		line-height: 1.3;
	}

	.feature-card:hover .fc-label { color: var(--text-accent); }

	.fc-badge {
		font-size: 9.5px;
		font-weight: 700;
		padding: 1px 7px;
		border-radius: 6px;
		border: 1px solid;
		letter-spacing: 0.05em;
		position: relative;
		z-index: 1;
		line-height: 1.7;
		opacity: 0.75;
	}
</style>
