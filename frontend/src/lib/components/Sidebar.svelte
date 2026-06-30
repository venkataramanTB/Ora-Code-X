<script>
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { page } from '$app/stores';
	import { sidebarOpen } from '$lib/stores/navigation.js';
	import { NAV_ITEMS } from '$lib/data/nav.js';
	import { ICON_MAP } from '$lib/data/icons.js';
	import NavItem from './NavItem.svelte';

	const CloseIcon = ICON_MAP['X'];

	// Close on route change
	let prevPath = '';
	$effect(() => {
		const current = $page.url.pathname;
		if (prevPath && current !== prevPath) sidebarOpen.set(false);
		prevPath = current;
	});

	// Detect active top-level section for accent colouring
	const activeSection = $derived(
		NAV_ITEMS.find(i => {
			const href = i.href ?? `/${i.id}`;
			return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
		}) ?? null
	);

	function closeOnEscape(e) {
		if (e.key === 'Escape') sidebarOpen.set(false);
	}

	// Sections with a visual separator before them (all except first)
	const DIVIDER_BEFORE = new Set(['mytools', 'workspace', 'monitoring', 'dashboard', 'admin']);
</script>

<svelte:window onkeydown={closeOnEscape} />

{#if $sidebarOpen}
	<div
		class="backdrop"
		onclick={() => sidebarOpen.set(false)}
		role="presentation"
	></div>

	<nav
		class="sidebar neo-convex elev-3"
		transition:fly={{ x: -340, duration: 300, easing: cubicOut }}
		aria-label="Main navigation"
	>
		<!-- Header -->
		<div class="sidebar-header" style="--section-accent:{activeSection?.accent ?? 'var(--accent-primary)'}">
			<div class="header-brand">
				<span class="brand-mark" style="color:{activeSection?.accent ?? 'var(--accent-primary)'}">O</span>
				<div class="brand-text">
					<span class="brand-name">OraCode<span class="x-char">X</span></span>
					<span class="brand-sub">Studio</span>
				</div>
			</div>
			<button class="close-btn" onclick={() => sidebarOpen.set(false)} aria-label="Close navigation">
				<CloseIcon size={16} />
			</button>
		</div>

		<!-- Active section indicator strip -->
		{#if activeSection}
			<div class="active-strip" style="background:{activeSection.accent}"></div>
		{/if}

		<!-- Nav tree -->
		<ul class="sidebar-nav" role="list">
			{#each NAV_ITEMS as item (item.id)}
				{#if DIVIDER_BEFORE.has(item.id)}
					<li class="nav-divider" role="separator" aria-hidden="true"></li>
				{/if}
				<li>
					<NavItem node={item} depth={0} />
				</li>
			{/each}
		</ul>

		<!-- Footer -->
		<div class="sidebar-footer">
			<span class="footer-label">OraCodeX Studio</span>
			<span class="footer-version">v1.0</span>
		</div>
	</nav>
{/if}

<style>
	.backdrop {
		position: fixed; inset: 0;
		z-index: 30;
		background: rgba(0, 0, 0, 0.52);
		backdrop-filter: blur(2px);
		-webkit-backdrop-filter: blur(2px);
	}

	.sidebar {
		position: fixed; top: 0; left: 0;
		height: 100dvh; width: 320px;
		z-index: 40;
		display: flex; flex-direction: column;
		border-radius: 0 20px 20px 0;
		overflow: hidden;
		background: var(--bg-base);
	}

	/* ── Header ─────────────────────────────────────── */

	.sidebar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px 16px 16px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
		flex-shrink: 0;
	}

	.header-brand {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.brand-mark {
		width: 32px; height: 32px;
		border-radius: 9px;
		background: rgba(var(--accent-primary-rgb), 0.08);
		border: 1px solid currentColor;
		border-color: color-mix(in srgb, currentColor 30%, transparent);
		display: flex; align-items: center; justify-content: center;
		font-size: 15px; font-weight: 800;
		flex-shrink: 0;
		transition: color 0.25s;
	}

	.brand-text {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.brand-name {
		font-size: 15px;
		font-weight: 700;
		color: var(--text-accent);
		letter-spacing: -0.015em;
		line-height: 1;
	}

	.brand-sub {
		font-size: 9.5px;
		font-weight: 500;
		color: var(--text-muted);
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.close-btn {
		background: none; border: none;
		color: var(--text-muted); cursor: pointer;
		padding: 7px; border-radius: 9px;
		display: flex; align-items: center;
		transition: color 0.15s, background 0.15s;
		flex-shrink: 0;
	}
	.close-btn:hover {
		color: var(--text-accent);
		background: rgba(255, 255, 255, 0.05);
	}

	/* Active section accent strip — 2px line below header */
	.active-strip {
		height: 2px;
		opacity: 0.55;
		flex-shrink: 0;
		transition: background 0.3s;
	}

	/* ── Nav list ────────────────────────────────────── */

	.sidebar-nav {
		list-style: none;
		padding: 8px 8px 12px;
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		display: flex;
		flex-direction: column;
		gap: 1px;
		scrollbar-width: thin;
		scrollbar-color: rgba(255, 255, 255, 0.07) transparent;
	}

	.nav-divider {
		height: 1px;
		background: rgba(255, 255, 255, 0.05);
		margin: 6px 8px;
		border-radius: 1px;
	}

	/* ── Footer ──────────────────────────────────────── */

	.sidebar-footer {
		padding: 12px 18px;
		border-top: 1px solid rgba(255, 255, 255, 0.04);
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.footer-label {
		font-size: 11px;
		color: var(--text-muted);
		letter-spacing: 0.04em;
	}

	.footer-version {
		font-size: 10px;
		color: var(--text-muted);
		opacity: 0.5;
		font-variant-numeric: tabular-nums;
	}
</style>
