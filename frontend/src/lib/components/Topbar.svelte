<script>
	import { spring } from 'svelte/motion';
	import { Show, UserButton, useClerkContext } from 'svelte-clerk';
	import { scrolled } from '$lib/stores/theme.js';
	import { sidebarOpen } from '$lib/stores/navigation.js';
	import { TAGLINE } from '$lib/data/nav.js';
	import { ICON_MAP } from '$lib/data/icons.js';
	import { magnetic } from '$lib/actions/magnetic.js';
	import { snappy } from '$lib/motion/springs.js';
	import AppearancePicker from '$lib/components/AppearancePicker.svelte';

	const MenuIcon   = ICON_MAP['Menu'];
	const CloseIcon  = ICON_MAP['X'];
	const SearchIcon = ICON_MAP['Search'];

	const topbarH  = spring(68, snappy);
	const taglineH = spring(32, snappy);

	$effect(() => {
		topbarH.set($scrolled ? 52 : 68);
		taglineH.set($scrolled ? 0 : 32);
	});

	const { user } = useClerkContext();

	function getInitials(u) {
		return ((u?.firstName?.[0] ?? '') + (u?.lastName?.[0] ?? '')).toUpperCase() || '?';
	}
</script>

<header class="topbar" style:height="{$topbarH + $taglineH}px">
	<span class="top-shine" aria-hidden="true"></span>

	<div class="topbar-inner" style:height="{$topbarH}px">

		<!-- ── Left: hamburger + logo ── -->
		<div class="left-cluster">
			<button
				class="hamburger"
				class:is-open={$sidebarOpen}
				onclick={() => sidebarOpen.update(v => !v)}
				aria-label={$sidebarOpen ? 'Close navigation' : 'Open navigation'}
				aria-expanded={$sidebarOpen}
				use:magnetic
			>
				<span class="hamburger-icon">
					{#if $sidebarOpen}
						<CloseIcon size={15} />
					{:else}
						<MenuIcon size={15} />
					{/if}
				</span>
				<span class="hamburger-label">{$sidebarOpen ? 'Close' : 'Menu'}</span>
			</button>

			<a class="logo-link" href="/" use:magnetic>
				<span class="logo-mark" aria-hidden="true">O</span>
				<span class="logo-text">
					<span class="logo-name">OraBridge<span class="x-char">X</span></span>
					<span class="logo-sub">Nexus</span>
				</span>
			</a>
		</div>

		<!-- ── Right: actions ── -->
		<div class="topbar-actions">
			<button class="icon-btn search-btn" aria-label="Search" use:magnetic>
				<SearchIcon size={15} />
				<span class="search-hint">Search…</span>
			</button>

			<AppearancePicker />

			<Show when="signed-in">
				<div class="user-zone">
					{#if user?.imageUrl}
						<img
							class="user-avatar"
							src={user.imageUrl}
							alt="Profile"
							aria-hidden="true"
						/>
					{:else}
						<span class="user-avatar user-initials" aria-hidden="true">
							{getInitials(user)}
						</span>
					{/if}
					<div class="clerk-user-btn">
						<UserButton afterSignOutUrl="/sign-in" />
					</div>
				</div>
			</Show>
			<Show when="signed-out">
				<a href="/sign-in" class="sign-in-pill">Sign In</a>
			</Show>
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
		background: var(--topbar-bg);
		box-shadow:
			-6px -6px 14px var(--shadow-light),
			 6px  6px 14px var(--shadow-dark),
			 0    0   40px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 var(--border-subtle);
		transition: box-shadow 0.3s ease;
		view-transition-name: topbar;
	}

	.top-shine {
		position: absolute;
		top: 0; left: 12%; right: 12%;
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255, 255, 255, 0.1) 30%,
			rgba(var(--accent-primary-rgb), 0.2) 50%,
			rgba(255, 255, 255, 0.1) 70%,
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
			rgba(var(--accent-primary-rgb), 0.25) 25%,
			rgba(var(--accent-primary-rgb), 0.08) 75%,
			transparent 100%
		);
		pointer-events: none;
		z-index: 4;
	}

	/* ── Inner row ──────────────────────────────────── */

	.topbar-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 16px 0 12px;
		position: relative;
		z-index: 2;
		flex-shrink: 0;
	}

	/* ── Left cluster ────────────────────────────────── */

	.left-cluster {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	/* ── Hamburger ───────────────────────────────────── */

	.hamburger {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px 6px 9px;
		border-radius: 11px;
		border: 1px solid rgba(var(--accent-primary-rgb), 0.20);
		background: rgba(var(--accent-primary-rgb), 0.06);
		color: var(--text-muted);
		cursor: pointer;
		font-size: 11.5px;
		font-weight: 600;
		letter-spacing: 0.04em;
		transition: background 0.15s, border-color 0.15s, box-shadow 0.15s, color 0.15s;
		flex-shrink: 0;
	}

	.hamburger:hover {
		background: rgba(var(--accent-primary-rgb), 0.12);
		border-color: rgba(var(--accent-primary-rgb), 0.38);
		color: var(--accent-primary);
		box-shadow: 0 0 12px rgba(var(--accent-primary-rgb), 0.12);
	}

	.hamburger.is-open {
		background: rgba(var(--accent-primary-rgb), 0.12);
		border-color: rgba(var(--accent-primary-rgb), 0.38);
		color: var(--accent-primary);
		box-shadow: 0 0 14px rgba(var(--accent-primary-rgb), 0.14);
	}

	.hamburger-icon {
		display: flex;
		align-items: center;
		transition: transform 0.22s ease;
	}

	.hamburger.is-open .hamburger-icon {
		transform: rotate(90deg);
	}

	.hamburger-label {
		font-size: 11.5px;
		font-weight: 600;
		letter-spacing: 0.04em;
	}

	/* ── Logo ────────────────────────────────────────── */

	.logo-link {
		display: flex;
		align-items: center;
		gap: 9px;
		text-decoration: none;
		flex-shrink: 0;
		user-select: none;
	}

	.logo-mark {
		width: 30px; height: 30px;
		border-radius: 8px;
		background: linear-gradient(135deg, rgba(var(--accent-primary-rgb), 0.15) 0%, rgba(var(--accent-primary-rgb), 0.05) 100%);
		border: 1px solid rgba(var(--accent-primary-rgb), 0.25);
		display: flex; align-items: center; justify-content: center;
		font-size: 14px; font-weight: 800;
		color: var(--accent-primary);
		text-shadow: 0 0 10px rgba(var(--accent-primary-rgb), 0.6);
		box-shadow: 0 0 12px rgba(var(--accent-primary-rgb), 0.1), inset 0 1px 0 rgba(255,255,255,0.06);
		flex-shrink: 0;
	}

	.logo-text {
		display: flex;
		flex-direction: column;
		line-height: 1;
	}

	.logo-name {
		font-size: 14.5px;
		font-weight: 700;
		color: var(--text-accent);
		letter-spacing: -0.02em;
		white-space: nowrap;
		line-height: 1;
	}

	.logo-sub {
		font-size: 9.5px;
		font-weight: 500;
		color: var(--text-muted);
		letter-spacing: 0.12em;
		text-transform: uppercase;
		margin-top: 2px;
		display: block;
	}

	/* ── Actions ─────────────────────────────────────── */

	.topbar-actions {
		display: flex;
		align-items: center;
		gap: 6px;
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
		border: 1px solid var(--border-subtle);
		padding: 5px 12px 5px 9px;
		gap: 6px;
		border-radius: 10px;
		color: var(--text-muted);
	}

	.search-hint {
		font-size: 11.5px;
		font-weight: 400;
		letter-spacing: 0.01em;
		opacity: 0.6;
	}

	/* User avatar + Clerk overlay */
	.user-zone {
		position: relative;
		width: 32px;
		height: 32px;
		flex-shrink: 0;
	}

	.user-avatar {
		width: 32px;
		height: 32px;
		border-radius: var(--radius-avatar, 50%);
		object-fit: cover;
		border: 1px solid rgba(var(--accent-primary-rgb), 0.35);
		box-shadow: 0 0 10px rgba(var(--accent-primary-rgb), 0.14);
		display: block;
		transition: border-color 0.15s, box-shadow 0.15s;
	}
	.user-zone:hover .user-avatar {
		border-color: rgba(var(--accent-primary-rgb), 0.6);
		box-shadow: 0 0 18px rgba(var(--accent-primary-rgb), 0.28);
	}

	.user-initials {
		background: rgba(var(--accent-primary-rgb), 0.14);
		color: var(--accent-primary);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.04em;
	}

	.clerk-user-btn {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.clerk-user-btn :global(.cl-userButtonTrigger) {
		width: 32px !important;
		height: 32px !important;
		opacity: 0 !important;
		cursor: pointer !important;
		border-radius: var(--radius-avatar, 50%) !important;
	}

	.sign-in-pill {
		display: flex;
		align-items: center;
		padding: 5px 14px;
		border-radius: 11px;
		border: 1px solid rgba(var(--accent-primary-rgb), 0.28);
		background: rgba(var(--accent-primary-rgb), 0.07);
		color: var(--accent-primary);
		text-decoration: none;
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.03em;
		transition: background 0.15s, box-shadow 0.15s, border-color 0.15s;
	}
	.sign-in-pill:hover {
		background: rgba(var(--accent-primary-rgb), 0.14);
		border-color: rgba(var(--accent-primary-rgb), 0.45);
		box-shadow: 0 0 14px rgba(var(--accent-primary-rgb), 0.15);
	}

	/* ── Tagline marquee ──────────────────────────────── */

	.tagline-bar {
		overflow: hidden;
		flex-shrink: 0;
		border-top: 1px solid var(--border-subtle);
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
