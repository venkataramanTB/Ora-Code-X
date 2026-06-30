<script>
	import { untrack } from 'svelte';
	import { page } from '$app/stores';
	import { ICON_MAP } from '$lib/data/icons.js';
	import { magnetic } from '$lib/actions/magnetic.js';
	import { pendingExpand } from '$lib/stores/navigation.js';
	import NavItem from './NavItem.svelte';

	/** @type {{ node: import('$lib/data/nav.js').NavNode, depth?: number }} */
	let { node, depth = 0 } = $props();

	const ChevronDown = ICON_MAP['ChevronDown'];
	const Icon = $derived(node.iconName ? (ICON_MAP[node.iconName] ?? null) : null);
	const accent = $derived(node.accent ?? 'var(--accent-primary)');
	const hasChildren = $derived((node.children ?? []).length > 0);

	const pathname = $derived($page.url.pathname);
	const isCurrentPage = $derived(!!node.href && pathname === node.href);
	const isAncestor    = $derived(!!node.href && pathname.startsWith(node.href + '/'));
	const isActive      = $derived(isCurrentPage || isAncestor);

	let expanded = $state(false);

	/** @param {import('$lib/data/nav.js').NavNode} n @param {string} path */
	function hasActiveDescendant(n, path) {
		if (n.href && (path === n.href || path.startsWith(n.href + '/'))) return true;
		return (n.children ?? []).some(c => hasActiveDescendant(c, path));
	}

	$effect(() => {
		if (hasChildren && hasActiveDescendant(node, pathname)) expanded = true;
	});

	// Expand when triggered from a home-page feature card click
	$effect(() => {
		if ($pendingExpand === node.id && hasChildren) {
			expanded = true;
			untrack(() => pendingExpand.set(null));
		}
	});

	/** @param {string} text */
	function formatLabel(text) {
		return text.replace(/X(?=[a-z]|ion|ing|$)/g, '<span class="x-char">X</span>');
	}
</script>

{#if !hasChildren && node.href}
	<a
		class="nav-item nav-leaf"
		class:is-active={isCurrentPage}
		class:depth-1={depth === 1}
		class:depth-2={depth >= 2}
		href={node.href}
		style="--item-accent:{accent}"
		use:magnetic
	>
		{#if Icon && depth <= 1}
			<span class="nav-icon" style:color={accent}>
				<Icon size={depth === 0 ? 20 : 16} />
			</span>
		{/if}
		<span class="nav-label">{@html formatLabel(node.label)}</span>
		{#if isCurrentPage}
			<span class="active-dot" aria-hidden="true"></span>
		{/if}
	</a>
{:else}
	<div class="nav-branch-wrap">
		{#if node.href}
			<a
				class="nav-item nav-branch-link"
				class:is-active={isActive}
				class:depth-1={depth === 1}
				href={node.href}
				style="--item-accent:{accent}"
			>
				{#if Icon && depth <= 1}
					<span class="nav-icon" style:color={accent}>
						<Icon size={depth === 0 ? 20 : 16} />
					</span>
				{/if}
				<span class="nav-label">{@html formatLabel(node.label)}</span>
			</a>
		{:else}
			<button
				class="nav-item nav-branch-btn"
				class:is-active={isActive}
				class:depth-1={depth === 1}
				onclick={() => (expanded = !expanded)}
				aria-expanded={expanded}
				style="--item-accent:{accent}"
				use:magnetic
			>
				{#if Icon && depth <= 1}
					<span class="nav-icon" style:color={accent}>
						<Icon size={depth === 0 ? 20 : 16} />
					</span>
				{/if}
				<span class="nav-label">{@html formatLabel(node.label)}</span>
			</button>
		{/if}

		{#if hasChildren}
			<button
				class="chevron-btn"
				class:open={expanded}
				onclick={() => (expanded = !expanded)}
				aria-label="Toggle {node.label}"
			>
				<ChevronDown size={14} />
			</button>
		{/if}
	</div>

	{#if expanded && hasChildren}
		<ul class="sub-list" role="list">
			{#each node.children as child (child.id)}
				<li>
					<NavItem node={child} depth={depth + 1} />
				</li>
			{/each}
		</ul>
	{/if}
{/if}

<style>
	/* ── Shared nav-item base ── */
	.nav-item {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		padding: 8px 14px;
		border-radius: 10px;
		text-align: left;
		font-size: 13.5px;
		font-weight: 500;
		color: var(--text-primary);
		text-decoration: none;
		border: none;
		background: none;
		cursor: pointer;
		transition: background 0.14s, color 0.14s;
		position: relative;
		box-sizing: border-box;
	}

	.nav-item::before {
		content: '';
		position: absolute;
		left: 0; top: 50%;
		transform: translateY(-50%) scaleY(0);
		width: 3px; height: 55%;
		background: var(--item-accent);
		border-radius: 0 3px 3px 0;
		transition: transform 0.18s ease;
	}

	.nav-item:hover,
	.nav-item.is-active {
		background: rgba(255, 255, 255, 0.028);
		color: var(--text-accent);
	}

	.nav-item.is-active::before {
		transform: translateY(-50%) scaleY(1);
	}

	.nav-item.depth-1 {
		font-size: 13px;
		padding: 7px 12px;
	}

	.nav-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		transition: filter 0.18s;
	}

	.nav-item:hover .nav-icon,
	.nav-item.is-active .nav-icon {
		filter: drop-shadow(0 0 5px var(--item-accent));
	}

	.nav-label { flex: 1; }

	.active-dot {
		width: 5px; height: 5px;
		border-radius: 50%;
		background: var(--item-accent);
		flex-shrink: 0;
		opacity: 0.8;
	}

	/* ── Branch row (link or btn + chevron side by side) ── */
	.nav-branch-wrap {
		display: flex;
		align-items: stretch;
	}

	.nav-branch-link {
		flex: 1;
		border-radius: 10px 0 0 10px;
	}

	.nav-branch-btn {
		flex: 1;
		border-radius: 10px 0 0 10px;
	}

	.chevron-btn {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-muted);
		border-radius: 0 10px 10px 0;
		transition: background 0.14s, color 0.14s, transform 0.22s ease;
	}

	.chevron-btn:hover {
		background: rgba(255, 255, 255, 0.04);
		color: var(--text-accent);
	}

	.chevron-btn.open {
		transform: rotate(-180deg);
	}

	/* ── Sub-list (children) ── */
	.sub-list {
		list-style: none;
		padding: 2px 0 2px 0;
		margin: 1px 0 1px 20px;
		display: flex;
		flex-direction: column;
		gap: 1px;
		border-left: 1px solid rgba(255, 255, 255, 0.05);
		padding-left: 8px;
	}

	/* depth-2 leaves: smaller, muted */
	:global(.sub-list .sub-list .nav-item) {
		font-size: 12.5px;
		padding: 6px 10px;
		color: var(--text-muted);
	}

	:global(.sub-list .sub-list .nav-item:hover),
	:global(.sub-list .sub-list .nav-item.is-active) {
		color: var(--item-accent);
		background: rgba(255, 255, 255, 0.02);
	}
</style>
