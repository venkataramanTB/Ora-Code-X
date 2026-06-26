<script>
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { sidebarOpen } from '$lib/stores/navigation.js';
	import { NAV_ITEMS } from '$lib/data/nav.js';
	import { ICON_MAP } from '$lib/data/icons.js';
	import NavItem from './NavItem.svelte';

	const CloseIcon = ICON_MAP['X'];

	function closeOnEscape(e) {
		if (e.key === 'Escape') sidebarOpen.set(false);
	}
</script>

<svelte:window onkeydown={closeOnEscape} />

{#if $sidebarOpen}
	<div
		class="backdrop"
		data-testid="sidebar-backdrop"
		onclick={() => sidebarOpen.set(false)}
		role="presentation"
	></div>

	<nav
		class="sidebar neo-convex elev-3"
		transition:fly={{ x: -320, duration: 320, easing: cubicOut }}
		aria-label="Main navigation"
	>
		<div class="sidebar-header">
			<span class="sidebar-logo">OraCode<span class="x-char">X</span></span>
			<button class="close-btn" onclick={() => sidebarOpen.set(false)} aria-label="Close navigation">
				<CloseIcon size={18} />
			</button>
		</div>

		<ul class="sidebar-nav" role="list">
			{#each NAV_ITEMS as item (item.id)}
				<li>
					<NavItem
						id={item.id}
						label={item.label}
						iconName={item.iconName}
						accent={item.accent}
						subItems={item.subItems}
						expandable={item.subItems.length > 0}
					/>
				</li>
			{/each}
		</ul>

		<div class="sidebar-footer">
			<span class="version-tag">OraCodeX Studio</span>
		</div>
	</nav>
{/if}

<style>
	.backdrop {
		position: fixed; inset: 0;
		z-index: 30;
		background: rgba(0, 0, 0, 0.55);
		backdrop-filter: none;
	}

	.sidebar {
		position: fixed; top: 0; left: 0;
		height: 100vh; width: 300px;
		z-index: 40;
		display: flex; flex-direction: column;
		border-radius: 0 24px 24px 0;
		overflow: hidden;
	}

	.sidebar-header {
		display: flex; align-items: center; justify-content: space-between;
		padding: 22px 20px 16px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
		flex-shrink: 0;
	}

	.sidebar-logo { font-size: 18px; font-weight: 700; color: var(--text-accent); letter-spacing: -0.01em; }

	.close-btn {
		background: none; border: none;
		color: var(--text-muted); cursor: pointer;
		padding: 7px; border-radius: 9px;
		display: flex; align-items: center;
		transition: color 0.15s, background 0.15s;
	}
	.close-btn:hover { color: var(--text-accent); background: rgba(255,255,255,0.04); }

	.sidebar-nav {
		list-style: none; padding: 10px 8px;
		flex: 1; overflow-y: auto; overflow-x: hidden;
		display: flex; flex-direction: column; gap: 1px;
		scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent;
	}

	.sidebar-footer {
		padding: 14px 20px;
		border-top: 1px solid rgba(255,255,255,0.04);
		flex-shrink: 0;
	}

	.version-tag { font-size: 11px; color: var(--text-muted); letter-spacing: 0.05em; }
</style>
