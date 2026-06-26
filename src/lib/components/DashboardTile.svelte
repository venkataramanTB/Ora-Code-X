<script>
	import { untrack } from 'svelte';
	import { tilt } from '$lib/actions/tilt.js';
	import { ICON_MAP } from '$lib/data/icons.js';

	let {
		id = '',
		label = '',
		iconName = '',
		accent = '#00d4ff',
		accentGlow = 'rgba(0,212,255,0.15)',
		subItems = [],
		size = 'small',
		gridArea = ''
	} = $props();

	let expanded = $state(untrack(() => size === 'hero'));
	let pressing = $state(false);

	const Icon = $derived(ICON_MAP[iconName] ?? ICON_MAP['PieChart']);

	const CFG = {
		hero:  { elev: 4, icon: 72, radius: 24, angle: 6  },
		wide:  { elev: 3, icon: 52, radius: 20, angle: 8  },
		small: { elev: 2, icon: 48, radius: 16, angle: 8  }
	};
	const cfg = $derived(CFG[size] ?? CFG.small);

	function handleClick() {
		if (size === 'hero') return;
		pressing = true;
		setTimeout(() => { pressing = false; }, 140);
		expanded = !expanded;
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
	style="--accent:{accent}; --glow:{accentGlow}"
	use:tilt={{ maxAngle: cfg.angle }}
	aria-label={label}
>
	<!-- Ambient glow layer -->
	<span class="tile-glow" aria-hidden="true"
		style="background:radial-gradient(circle at 40% 40%, {accentGlow} 0%, transparent 65%)"
	></span>

	<!-- Main clickable area -->
	<button class="tile-inner" onclick={handleClick} aria-expanded={size !== 'hero' ? expanded : undefined}>
		<span class="tile-icon" style:color={accent} style:filter="drop-shadow(0 0 10px {accent}88)">
			<Icon size={cfg.icon} strokeWidth={1.5} />
		</span>

		<span class="tile-label">
			{#if size === 'hero'}
				<span class="hero-title">{@html formatLabel(label)}</span>
				<span class="hero-sub">The Intelligent Oracle Cloud Delivery Platform</span>
			{:else}
				{@html formatLabel(label)}
			{/if}
		</span>
	</button>

	<!-- Sub-item chips -->
	{#if expanded && subItems.length}
		<ul class="chips" role="list">
			{#each subItems as item, i (item.href)}
				<li class="chip neo-concave elev-1" style="animation-delay:{i * 30}ms">
					<a href={item.href} style="--chip-accent:{accent}">{@html formatLabel(item.label)}</a>
				</li>
			{/each}
		</ul>
	{/if}

	<!-- Hover border glow -->
	<span class="border-glow" aria-hidden="true"></span>
</article>

<style>
	.tile {
		position: relative; overflow: hidden;
		background: var(--bg-base);
		display: flex; flex-direction: column;
		cursor: default;
		transition: box-shadow 0.18s ease;
		will-change: transform;
	}

	/* Dynamic shadow tilt override — matches .neo-tiltable but allows pressing state */
	.tile.pressing {
		box-shadow:
			inset -4px -4px 8px var(--shadow-light),
			inset  4px  4px 8px var(--shadow-dark) !important;
		transform: scale(0.985) !important;
	}

	/* Hover elevation bump */
	.tile:hover:not(.pressing) {
		box-shadow:
			calc(-16px + var(--tilt-y, 0) * 1.2px) calc(-16px + var(--tilt-x, 0) * 1.2px) 32px var(--shadow-light),
			calc( 16px + var(--tilt-y, 0) * 1.2px) calc( 16px + var(--tilt-x, 0) * 1.2px) 32px var(--shadow-dark);
	}

	.tile-glow {
		position: absolute; inset: 0;
		pointer-events: none;
		opacity: 0.55;
		transition: opacity 0.3s ease;
		z-index: 0;
	}
	.tile:hover .tile-glow { opacity: 1; }

	.border-glow {
		position: absolute; inset: 0;
		border-radius: inherit;
		pointer-events: none;
		z-index: 3;
		box-shadow: inset 0 0 0 0 var(--accent);
		transition: box-shadow 0.25s ease;
		opacity: 0;
	}
	.tile:hover .border-glow {
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 40%, transparent);
		opacity: 1;
	}

	.tile-inner {
		display: flex; flex-direction: column;
		align-items: center; justify-content: center;
		gap: 14px;
		padding: 32px 22px 22px;
		background: none; border: none;
		width: 100%; cursor: pointer;
		position: relative; z-index: 1;
		-webkit-tap-highlight-color: transparent;
	}

	.is-hero .tile-inner {
		align-items: flex-start;
		padding: 36px 30px 24px;
	}

	.is-wide .tile-inner {
		flex-direction: row; align-items: center;
		justify-content: flex-start; gap: 22px;
		padding: 0 28px; height: 100%;
	}

	.tile-icon {
		position: relative; z-index: 1;
		display: flex; align-items: center;
		transition: transform 0.2s ease;
		flex-shrink: 0;
	}
	.tile:hover .tile-icon { transform: scale(1.09) translateY(-2px); }
	.is-wide:hover .tile-icon { transform: scale(1.07); }

	.tile-label {
		position: relative; z-index: 1;
		font-size: 11.5px; font-weight: 600;
		letter-spacing: 0.1em; text-transform: uppercase;
		color: var(--text-muted);
		transition: color 0.2s;
		display: flex; flex-direction: column; gap: 4px;
	}
	.tile:hover .tile-label { color: var(--text-accent); }

	.hero-title {
		font-size: 20px; font-weight: 700;
		letter-spacing: -0.01em; text-transform: none;
		color: var(--text-accent);
	}
	.hero-sub {
		font-size: 12px; font-weight: 400;
		letter-spacing: 0; text-transform: none;
		color: var(--text-muted); line-height: 1.5;
		max-width: 240px;
	}

	.is-wide .tile-label {
		font-size: 13px; font-weight: 600;
		letter-spacing: 0.06em; text-transform: uppercase;
		color: var(--text-primary);
	}

	/* Chip list */
	.chips {
		list-style: none;
		display: flex; flex-wrap: wrap;
		gap: 6px; padding: 0 24px 24px;
		position: relative; z-index: 1;
	}
	.is-hero .chips { padding: 0 30px 30px; }
	.is-wide .chips { padding: 0 28px 16px; }

	.chip {
		border-radius: 20px;
		opacity: 0;
		animation: chipIn 0.2s ease forwards;
	}

	.chip a {
		display: block; padding: 5px 13px;
		font-size: 11.5px; color: var(--text-muted);
		text-decoration: none; border-radius: 20px;
		transition: color 0.15s, background 0.15s;
		white-space: nowrap;
	}
	.chip a:hover { color: var(--chip-accent); background: rgba(255,255,255,0.03); }

	@keyframes chipIn {
		from { opacity: 0; transform: translateY(5px) scale(0.96); }
		to   { opacity: 1; transform: translateY(0) scale(1); }
	}
</style>
