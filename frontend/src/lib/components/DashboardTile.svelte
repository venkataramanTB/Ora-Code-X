<script>
	import { untrack }       from 'svelte';
	import { fly }           from 'svelte/transition';
	import { cubicOut }      from 'svelte/easing';
	import { goto }          from '$app/navigation';
	import { tilt }          from '$lib/actions/tilt.js';
	import { ICON_MAP }      from '$lib/data/icons.js';

	let {
		id        = '',
		label     = '',
		iconName  = '',
		accent    = '#00d4ff',
		accentGlow = 'rgba(0,212,255,0.15)',
		subItems  = [],
		size      = 'small',
		gridArea  = '',
		entryDelay = 0,
	} = $props();

	let expanded = $state(untrack(() => size === 'hero'));
	let pressing = $state(false);

	const Icon = $derived(ICON_MAP[iconName] ?? ICON_MAP['PieChart']);

	// Size config: angle = max tilt °, baseZ = resting depth px, hoverZ = extra lift px
	const CFG = {
		hero:  { elev: 4, icon: 72, radius: 24, angle: 4,  baseZ: 20, hoverZ: 32 },
		wide:  { elev: 3, icon: 52, radius: 20, angle: 4,  baseZ: 12, hoverZ: 28 },
		small: { elev: 2, icon: 48, radius: 16, angle: 5,  baseZ:  6, hoverZ: 26 },
	};
	const cfg = $derived(CFG[size] ?? CFG.small);

	async function handleClick() {
		if (size === 'hero') return;
		pressing = true;
		setTimeout(() => { pressing = false; }, 150);
		if (subItems.length > 0) {
			expanded = !expanded;
		} else {
			await goto(`/${id}`);
		}
	}

	function formatLabel(text) {
		return text.replace(/X(?=[a-z]|ion|ing|$)/g, '<span class="x-char">X</span>');
	}
</script>

<article
	class="tile neo-convex neo-tiltable elev-{cfg.elev}"
	class:pressing
	class:is-hero={size === 'hero'}
	class:is-wide={size === 'wide'}
	class:is-small={size === 'small'}
	style:grid-area={gridArea}
	style:border-radius="{cfg.radius}px"
	style="--accent:{accent}; --glow:{accentGlow}; --accent-r:{parseInt(accent.slice(1,3),16)}; --accent-g:{parseInt(accent.slice(3,5),16)}; --accent-b:{parseInt(accent.slice(5,7),16)}"
	use:tilt={{ maxAngle: cfg.angle, baseZ: cfg.baseZ, hoverZ: cfg.hoverZ }}
	aria-label={label}
	in:fly={{ y: 28, duration: 540, delay: entryDelay, easing: cubicOut }}
>
	<!-- Ambient glow layer -->
	<span
		class="tile-glow"
		aria-hidden="true"
		style="background:radial-gradient(ellipse at 40% 35%, {accentGlow} 0%, transparent 68%)"
	></span>

	<!-- Floating depth shadow (grows on hover via CSS) -->
	<span class="depth-shadow" aria-hidden="true"></span>

	<!-- Inner shine line at top -->
	<span class="shine" aria-hidden="true"></span>

	<!-- Main interactive area -->
	<button
		class="tile-inner"
		onclick={handleClick}
		aria-expanded={size !== 'hero' && subItems.length > 0 ? expanded : undefined}
	>
		<span
			class="tile-icon"
			style:color={accent}
			style:filter="drop-shadow(0 0 12px {accent}99)"
		>
			<Icon size={cfg.icon} strokeWidth={1.4} />
		</span>

		<span class="tile-label">
			{#if size === 'hero'}
				<span class="hero-title">{@html formatLabel(label)}</span>
				<span class="hero-sub">The Intelligent Oracle Cloud Delivery Platform</span>
			{:else if size === 'wide'}
				<span class="wide-title">{@html formatLabel(label)}</span>
			{:else}
				<span>{@html formatLabel(label)}</span>
			{/if}
		</span>

		<!-- Arrow hint for navigable tiles -->
		{#if size !== 'hero' && subItems.length === 0}
			<span class="nav-arrow" aria-hidden="true">→</span>
		{/if}
	</button>

	<!-- Sub-item chips (hero always visible, others toggle) -->
	{#if expanded && subItems.length}
		<ul class="chips" role="list">
			{#each subItems as item, i (item.href)}
				<li
					class="chip neo-concave elev-1"
					style="animation-delay:{i * 40}ms"
				>
					<a href={item.href} style="--chip-accent:{accent}">
						{@html formatLabel(item.label)}
					</a>
				</li>
			{/each}
		</ul>
	{/if}

	<!-- Border glow ring on hover -->
	<span class="border-glow" aria-hidden="true"></span>
</article>

<style>
	.tile {
		position: relative;
		overflow: hidden;
		background: var(--bg-base);
		display: flex;
		flex-direction: column;
		cursor: default;
		will-change: transform;
		/* transitions only for box-shadow — transform is JS-controlled via spring */
		transition: box-shadow var(--transition-speed, 220ms) var(--transition-easing, ease);
	}

	/* ── Press state ────────────────────────────────── */
	.tile.pressing {
		box-shadow:
			inset -4px -4px 8px var(--shadow-light),
			inset  4px  4px 8px var(--shadow-dark) !important;
		transition: box-shadow 0.06s ease !important;
	}

	/* ── Dynamic tilt shadow ────────────────────────── */
	.tile:not(.pressing) {
		box-shadow:
			calc(-8px  + var(--tilt-y, 0) * 1.6px) calc(-8px  + var(--tilt-x, 0) * 1.6px) 20px var(--shadow-light),
			calc( 8px  + var(--tilt-y, 0) * 1.6px) calc( 8px  + var(--tilt-x, 0) * 1.6px) 20px var(--shadow-dark);
	}

	/* ── Floating depth shadow below card ───────────── */
	.depth-shadow {
		position: absolute;
		inset: 10% 8%;
		bottom: -18px;
		height: 24px;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.25);
		filter: blur(12px);
		z-index: -1;
		opacity: 0;
		transition: opacity 0.3s ease, filter 0.3s ease;
		pointer-events: none;
	}
	.tile:hover .depth-shadow {
		opacity: 1;
		filter: blur(16px);
	}

	/* ── Ambient glow ───────────────────────────────── */
	.tile-glow {
		position: absolute;
		inset: 0;
		pointer-events: none;
		opacity: 0.5;
		transition: opacity 0.35s ease;
		z-index: 0;
	}
	.tile:hover .tile-glow { opacity: 1; }

	/* ── Top shine edge ─────────────────────────────── */
	.shine {
		position: absolute;
		top: 0; left: 10%; right: 10%;
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255,255,255,0.10) 30%,
			rgba(var(--accent-r, 0), var(--accent-g, 212), var(--accent-b, 255), 0.18) 50%,
			rgba(255,255,255,0.10) 70%,
			transparent 100%
		);
		pointer-events: none;
		z-index: 4;
	}

	/* ── Border glow ring ───────────────────────────── */
	.border-glow {
		position: absolute;
		inset: 0;
		border-radius: inherit;
		pointer-events: none;
		z-index: 3;
		box-shadow: inset 0 0 0 0 var(--accent);
		transition: box-shadow 0.28s ease, opacity 0.28s ease;
		opacity: 0;
	}
	.tile:hover .border-glow {
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 35%, transparent);
		opacity: 1;
	}

	/* ── Inner layout ───────────────────────────────── */
	.tile-inner {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 14px;
		padding: 32px 22px 20px;
		background: none;
		border: none;
		width: 100%;
		cursor: pointer;
		position: relative;
		z-index: 1;
		-webkit-tap-highlight-color: transparent;
	}

	.is-hero .tile-inner {
		align-items: flex-start;
		padding: 36px 30px 22px;
	}

	.is-wide .tile-inner {
		flex-direction: row;
		align-items: center;
		justify-content: flex-start;
		gap: 22px;
		padding: 0 28px;
		height: 100%;
	}

	/* ── Icon ───────────────────────────────────────── */
	.tile-icon {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		flex-shrink: 0;
		transition:
			transform var(--transition-speed, 250ms) var(--transition-easing, cubic-bezier(0.16,1,0.3,1)),
			filter    var(--transition-speed, 250ms) ease;
	}
	.tile:hover .tile-icon {
		transform: scale(1.11) translateY(-3px);
		filter: drop-shadow(0 0 18px var(--accent)) !important;
	}
	.is-wide:hover .tile-icon {
		transform: scale(1.08);
	}

	/* ── Label ──────────────────────────────────────── */
	.tile-label {
		position: relative;
		z-index: 1;
		font-size: 11px;
		font-weight: var(--font-weight-bold, 700);
		letter-spacing: var(--letter-spacing-ui, 0.10em);
		text-transform: uppercase;
		color: var(--text-muted);
		transition: color 0.2s;
		display: flex;
		flex-direction: column;
		gap: 5px;
	}
	.tile:hover .tile-label { color: var(--text-accent); }

	.hero-title {
		font-size: 20px;
		font-weight: 800;
		letter-spacing: -0.01em;
		text-transform: none;
		color: var(--text-accent);
	}
	.hero-sub {
		font-size: 12px;
		font-weight: 400;
		letter-spacing: 0;
		text-transform: none;
		color: var(--text-muted);
		line-height: 1.55;
		max-width: 240px;
	}

	.wide-title {
		font-size: 13.5px;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--text-primary);
	}
	.is-wide:hover .wide-title { color: var(--text-accent); }

	/* ── Navigation arrow ───────────────────────────── */
	.nav-arrow {
		position: absolute;
		bottom: 14px;
		right: 16px;
		font-size: 14px;
		color: var(--text-muted);
		opacity: 0;
		transform: translateX(-4px);
		transition: opacity 0.2s ease, transform 0.2s ease, color 0.2s ease;
		pointer-events: none;
		z-index: 2;
	}
	.tile:hover .nav-arrow {
		opacity: 1;
		transform: translateX(0);
		color: var(--accent);
	}

	/* ── Chip list ──────────────────────────────────── */
	.chips {
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		gap: 7px;
		padding: 0 24px 24px;
		position: relative;
		z-index: 1;
	}
	.is-hero .chips  { padding: 0 30px 28px; }
	.is-wide .chips  { padding: 0 28px 16px; }

	.chip {
		border-radius: var(--radius-chip, 20px);
		opacity: 0;
		animation: chipIn 0.24s ease forwards;
	}

	.chip a {
		display: block;
		padding: 5px 13px;
		font-size: 11.5px;
		color: var(--text-muted);
		text-decoration: none;
		border-radius: var(--radius-chip, 20px);
		transition: color 0.15s, background 0.15s;
		white-space: nowrap;
	}
	.chip a:hover {
		color: var(--chip-accent);
		background: rgba(255,255,255,0.03);
	}

	@keyframes chipIn {
		from { opacity: 0; transform: translateY(6px) scale(0.94); }
		to   { opacity: 1; transform: translateY(0)   scale(1);    }
	}
</style>
