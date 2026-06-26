<script>
	import { spring } from 'svelte/motion';
	import { scrolled } from '$lib/stores/theme.js';
	import { sidebarOpen } from '$lib/stores/navigation.js';
	import { NAV_ITEMS, TAGLINE } from '$lib/data/nav.js';
	import { ICON_MAP } from '$lib/data/icons.js';
	import { magnetic } from '$lib/actions/magnetic.js';
	import { snappy } from '$lib/motion/springs.js';

	const MenuIcon   = ICON_MAP['Menu'];
	const SearchIcon = ICON_MAP['Search'];
	const UserIcon   = ICON_MAP['User'];

	const topbarH   = spring(64, snappy);
	const taglineH  = spring(36, snappy);

	$effect(() => {
		topbarH.set($scrolled ? 48 : 64);
		taglineH.set($scrolled ? 0 : 36);
	});

	function formatLabel(text) {
		return text.replace(/X(?=[a-z]|ion|ing|$)/g, '<span class="x-char">X</span>');
	}
</script>

<header class="topbar neo-convex elev-3" style:height="{$topbarH}px">
	<div class="topbar-inner">
		{#if $scrolled}
			<button
				class="icon-btn hamburger"
				onclick={() => sidebarOpen.update(v => !v)}
				aria-label="Open navigation"
			>
				<MenuIcon size={20} />
			</button>
		{/if}

		<span class="logo" use:magnetic>
			OraCode<span class="x-char">X</span>
		</span>

		{#if !$scrolled}
			<nav class="topbar-nav" aria-label="Top navigation">
				{#each NAV_ITEMS as item (item.id)}
					{@const Icon = ICON_MAP[item.iconName]}
					<a
						class="nav-link"
						href="/{item.id}"
						style="--item-accent:{item.accent}"
						use:magnetic
					>
						{#if Icon}<span class="nav-link-icon" style:color={item.accent}><Icon size={15}/></span>{/if}
						<span>{@html formatLabel(item.label)}</span>
					</a>
				{/each}
			</nav>
		{/if}

		<div class="topbar-actions">
			<button class="icon-btn" aria-label="Search" use:magnetic><SearchIcon size={17}/></button>
			<button class="icon-btn user-btn" aria-label="User" use:magnetic>
				<UserIcon size={17}/>
			</button>
		</div>
	</div>

	<div class="tagline-bar" style:height="{$taglineH}px" aria-hidden="true">
		<div class="marquee">
			<span class="marquee-track">
				{#each [0, 1] as _}
					<span class="marquee-seg">
						{TAGLINE.prefix}<strong>{TAGLINE.brand}</strong>{TAGLINE.separator}{#each TAGLINE.keywords as kw, i}<span style="color:{kw.color}">{kw.word}</span>{i < TAGLINE.keywords.length - 1 ? '. ' : '.'}{/each}&nbsp;&nbsp;&nbsp;&nbsp;
					</span>
				{/each}
			</span>
		</div>
	</div>
</header>

<style>
	.topbar {
		position: fixed;
		top: 8px; left: 8px; right: 8px;
		z-index: 20;
		border-radius: 20px;
		overflow: hidden;
		display: flex; flex-direction: column;
	}

	.topbar-inner {
		display: flex; align-items: center; gap: 12px;
		padding: 0 18px;
		flex: 0 0 48px; min-height: 48px;
	}

	.logo {
		font-size: 17px; font-weight: 700;
		color: var(--text-accent);
		letter-spacing: -0.015em;
		white-space: nowrap; cursor: default;
		user-select: none;
	}

	.topbar-nav {
		display: flex; align-items: center; gap: 2px;
		flex: 1; justify-content: center;
	}

	.nav-link {
		display: flex; align-items: center; gap: 6px;
		padding: 5px 11px;
		color: var(--text-primary);
		text-decoration: none;
		font-size: 13px; font-weight: 500;
		border-radius: 10px;
		white-space: nowrap;
		transition: color 0.15s, background 0.15s;
		position: relative;
	}

	.nav-link::after {
		content: '';
		position: absolute; bottom: 0; left: 50%;
		transform: translateX(-50%) scaleX(0);
		width: 60%; height: 1.5px;
		background: var(--item-accent);
		border-radius: 2px;
		transition: transform 0.2s ease;
	}

	.nav-link:hover { color: var(--text-accent); background: rgba(255,255,255,0.025); }
	.nav-link:hover::after { transform: translateX(-50%) scaleX(1); }
	.nav-link:hover .nav-link-icon { filter: drop-shadow(0 0 5px var(--item-accent)); }

	.nav-link-icon { display: flex; align-items: center; }

	.topbar-actions {
		display: flex; align-items: center; gap: 2px;
		margin-left: auto;
	}

	.icon-btn {
		background: none; border: none;
		color: var(--text-muted); cursor: pointer;
		padding: 8px; border-radius: 10px;
		display: flex; align-items: center;
		transition: color 0.15s, background 0.15s;
	}
	.icon-btn:hover { color: var(--text-accent); background: rgba(255,255,255,0.04); }

	.user-btn {
		background: rgba(0, 212, 255, 0.08);
		color: var(--accent-cyan);
		border-radius: 50%;
		width: 32px; height: 32px;
		padding: 0;
		justify-content: center;
	}
	.user-btn:hover { background: rgba(0,212,255,0.16); color: var(--accent-cyan); }

	.hamburger { color: var(--text-primary); }

	/* Tagline marquee */
	.tagline-bar {
		overflow: hidden;
		border-top: 1px solid rgba(255,255,255,0.04);
		flex-shrink: 0;
	}

	.marquee {
		overflow: hidden; height: 36px;
		display: flex; align-items: center;
	}

	.marquee-track {
		display: inline-flex; white-space: nowrap;
		animation: marquee 32s linear infinite;
		font-size: 11.5px; color: var(--text-muted);
		padding: 0 20px;
		gap: 0;
	}

	.marquee-seg { padding-right: 40px; }
	.marquee-seg strong { color: var(--text-primary); font-weight: 600; }
</style>
