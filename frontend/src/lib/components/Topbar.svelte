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

	const topbarH  = spring(68, snappy);
	const taglineH = spring(32, snappy);

	$effect(() => {
		topbarH.set($scrolled ? 52 : 68);
		taglineH.set($scrolled ? 0 : 32);
	});

	function formatLabel(text) {
		return text.replace(/X(?=[a-z]|ion|ing|$)/g, '<span class="x-char">X</span>');
	}
</script>

<header class="topbar" style:height="{$topbarH + $taglineH}px">
	<!-- Subtle inner highlight line at top -->
	<span class="top-shine" aria-hidden="true"></span>

	<div class="topbar-inner" style:height="{$topbarH}px">
		{#if $scrolled}
			<button
				class="hamburger"
				onclick={() => sidebarOpen.update(v => !v)}
				aria-label="Open navigation"
			>
				<MenuIcon size={18} />
				<span class="hamburger-label">Menu</span>
			</button>
		{/if}

		<!-- Logo -->
		<a class="logo-link" href="/" use:magnetic>
			<span class="logo-mark" aria-hidden="true">O</span>
			<span class="logo-text">
				OraCode<span class="x-char">X</span>
				<span class="logo-sub">Studio</span>
			</span>
		</a>

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
						{#if Icon}
							<span class="nav-link-icon" style:color={item.accent}>
								<Icon size={14} strokeWidth={2} />
							</span>
						{/if}
						<span>{@html formatLabel(item.label)}</span>
					</a>
				{/each}
			</nav>
		{/if}

		<div class="topbar-actions">
			<button class="icon-btn search-btn" aria-label="Search" use:magnetic>
				<SearchIcon size={16} />
			</button>
			<button class="icon-btn user-btn" aria-label="User account" use:magnetic>
				<span class="user-initials">VT</span>
			</button>
		</div>
	</div>

	<!-- Tagline marquee strip -->
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

	<!-- Bottom accent line -->
	<span class="bottom-accent" aria-hidden="true"></span>
</header>

<style>
	.topbar {
		position: fixed;
		top: 10px; left: 10px; right: 10px;
		z-index: 20;
		border-radius: 18px;
		display: flex;
		flex-direction: column;
		overflow: hidden;

		/* Richer background: subtle gradient over dark base */
		background: linear-gradient(
			135deg,
			rgba(22, 28, 38, 0.97) 0%,
			rgba(18, 22, 30, 0.99) 60%,
			rgba(20, 26, 35, 0.97) 100%
		);

		/* Layered shadow: neomorphic depth + outer glow */
		box-shadow:
			-6px -6px 14px rgba(255, 255, 255, 0.035),
			 6px  6px 14px rgba(0, 0, 0, 0.6),
			 0    0   40px rgba(0, 0, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.06);

		transition: box-shadow 0.3s ease;
	}

	.top-shine {
		position: absolute;
		top: 0; left: 12%; right: 12%;
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255, 255, 255, 0.12) 30%,
			rgba(0, 212, 255, 0.18) 50%,
			rgba(255, 255, 255, 0.12) 70%,
			transparent 100%
		);
		border-radius: 1px;
		pointer-events: none;
		z-index: 4;
	}

	.bottom-accent {
		position: absolute;
		bottom: 0; left: 0; right: 0;
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(0, 212, 255, 0.25) 25%,
			rgba(0, 212, 255, 0.08) 75%,
			transparent 100%
		);
		pointer-events: none;
		z-index: 4;
	}

	.topbar-inner {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 0 20px;
		position: relative;
		z-index: 2;
		flex-shrink: 0;
	}

	/* ── Logo ────────────────────────────────────── */

	.logo-link {
		display: flex;
		align-items: center;
		gap: 10px;
		text-decoration: none;
		flex-shrink: 0;
		user-select: none;
	}

	.logo-mark {
		width: 32px; height: 32px;
		border-radius: 9px;
		background: linear-gradient(135deg, #00d4ff22 0%, #00d4ff08 100%);
		border: 1px solid rgba(0, 212, 255, 0.25);
		display: flex; align-items: center; justify-content: center;
		font-size: 15px; font-weight: 800;
		color: #00d4ff;
		text-shadow: 0 0 10px rgba(0, 212, 255, 0.6);
		box-shadow: 0 0 12px rgba(0, 212, 255, 0.1), inset 0 1px 0 rgba(255,255,255,0.06);
		flex-shrink: 0;
	}

	.logo-text {
		display: flex;
		flex-direction: column;
		line-height: 1;
	}

	.logo-text > :first-child {
		font-size: 15px;
		font-weight: 700;
		color: var(--text-accent);
		letter-spacing: -0.02em;
		white-space: nowrap;
	}

	.logo-sub {
		font-size: 10px;
		font-weight: 500;
		color: var(--text-muted);
		letter-spacing: 0.12em;
		text-transform: uppercase;
		margin-top: 2px;
		display: block;
	}

	/* ── Nav ─────────────────────────────────────── */

	.topbar-nav {
		display: flex;
		align-items: center;
		gap: 2px;
		flex: 1;
		justify-content: center;
		padding: 0 8px;
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 5px 12px;
		color: var(--text-muted);
		text-decoration: none;
		font-size: 12.5px;
		font-weight: 500;
		border-radius: 10px;
		white-space: nowrap;
		transition: color 0.15s, background 0.15s;
		position: relative;
		letter-spacing: 0.01em;
	}

	.nav-link::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		background: linear-gradient(135deg, var(--item-accent), transparent);
		opacity: 0;
		transition: opacity 0.2s;
	}

	.nav-link:hover {
		color: var(--text-accent);
		background: rgba(255, 255, 255, 0.04);
	}

	.nav-link:hover::before { opacity: 0.05; }

	.nav-link:hover .nav-link-icon {
		filter: drop-shadow(0 0 5px var(--item-accent));
	}

	.nav-link-icon {
		display: flex;
		align-items: center;
		transition: filter 0.2s;
	}

	/* ── Actions ─────────────────────────────────── */

	.topbar-actions {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-left: auto;
	}

	.icon-btn {
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		padding: 7px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: color 0.15s, background 0.15s;
	}

	.icon-btn:hover {
		color: var(--text-accent);
		background: rgba(255, 255, 255, 0.05);
	}

	.search-btn {
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 10px;
		padding: 6px 10px;
		gap: 6px;
		font-size: 12px;
		color: var(--text-muted);
		min-width: 36px;
	}

	.user-btn {
		width: 34px; height: 34px;
		padding: 0;
		border-radius: 50%;
		background: linear-gradient(135deg, rgba(0,212,255,0.18) 0%, rgba(0,212,255,0.06) 100%);
		border: 1px solid rgba(0, 212, 255, 0.3);
		box-shadow: 0 0 12px rgba(0, 212, 255, 0.12);
		overflow: hidden;
	}

	.user-btn:hover {
		background: linear-gradient(135deg, rgba(0,212,255,0.28) 0%, rgba(0,212,255,0.12) 100%);
		box-shadow: 0 0 18px rgba(0, 212, 255, 0.22);
	}

	.user-initials {
		font-size: 11px;
		font-weight: 700;
		color: #00d4ff;
		letter-spacing: 0.05em;
	}

	.hamburger {
		display: flex;
		align-items: center;
		gap: 7px;
		padding: 6px 14px 6px 10px;
		border-radius: 12px;
		border: 1px solid rgba(0, 212, 255, 0.22);
		background: rgba(0, 212, 255, 0.07);
		color: var(--accent-cyan);
		cursor: pointer;
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.04em;
		transition: background 0.15s, box-shadow 0.15s, border-color 0.15s;
		flex-shrink: 0;
	}

	.hamburger:hover {
		background: rgba(0, 212, 255, 0.14);
		border-color: rgba(0, 212, 255, 0.4);
		box-shadow: 0 0 14px rgba(0, 212, 255, 0.15);
	}

	.hamburger-label {
		color: var(--text-muted);
		font-size: 11.5px;
	}

	/* ── Tagline marquee ─────────────────────────── */

	.tagline-bar {
		overflow: hidden;
		flex-shrink: 0;
		border-top: 1px solid rgba(255, 255, 255, 0.04);
		position: relative;
		z-index: 2;
	}

	.marquee {
		overflow: hidden;
		height: 32px;
		display: flex;
		align-items: center;
	}

	.marquee-track {
		display: inline-flex;
		white-space: nowrap;
		animation: marquee 40s linear infinite;
		font-size: 11px;
		color: var(--text-muted);
		padding: 0 24px;
	}

	.marquee-seg { padding-right: 48px; }
	.marquee-seg strong { color: var(--text-primary); font-weight: 600; }
</style>
