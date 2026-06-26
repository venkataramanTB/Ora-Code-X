<script>
	import { ICON_MAP } from '$lib/data/icons.js';
	import { magnetic } from '$lib/actions/magnetic.js';

	let { id, label = '', iconName = '', accent = '#00d4ff', subItems = [], expandable = false } = $props();

	let expanded = $state(false);

	const Icon = $derived(ICON_MAP[iconName] ?? null);
	const Chevron = ICON_MAP['ChevronDown'];

	function formatLabel(text) {
		return text.replace(/X(?=[a-z]|ion|ing|$)/g, '<span class="x-char">X</span>');
	}

	function toggle() {
		if (expandable) expanded = !expanded;
	}
</script>

<div class="nav-item-wrapper">
	<button
		class="nav-item"
		class:has-children={expandable}
		onclick={toggle}
		style="--item-accent: {accent}"
		aria-expanded={expandable ? expanded : undefined}
		use:magnetic
	>
		<span class="nav-icon" style:color={accent}>
			{#if Icon}<Icon size={20} />{/if}
		</span>
		<span class="nav-label">{@html formatLabel(label)}</span>
		{#if expandable}
			<span class="chevron" class:open={expanded}><Chevron size={14} /></span>
		{/if}
	</button>

	{#if expanded && subItems.length}
		<ul class="sub-list" role="list">
			{#each subItems as item, i}
				<li class="sub-item neo-concave elev-1" style="animation-delay:{i * 35}ms">
					<a href={item.href}>{@html formatLabel(item.label)}</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.nav-item-wrapper { width: 100%; }

	.nav-item {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 10px 16px;
		background: none;
		border: none;
		color: var(--text-primary);
		cursor: pointer;
		border-radius: 12px;
		text-align: left;
		transition: background 0.15s, color 0.15s;
		position: relative;
	}

	.nav-item::after {
		content: '';
		position: absolute;
		left: 0; top: 50%;
		transform: translateY(-50%) scaleY(0);
		width: 3px; height: 60%;
		background: var(--item-accent);
		border-radius: 0 3px 3px 0;
		transition: transform 0.2s ease;
	}

	.nav-item:hover, .nav-item[aria-expanded="true"] {
		background: rgba(255, 255, 255, 0.025);
		color: var(--text-accent);
	}

	.nav-item:hover::after, .nav-item[aria-expanded="true"]::after {
		transform: translateY(-50%) scaleY(1);
	}

	.nav-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		transition: filter 0.2s;
	}

	.nav-item:hover .nav-icon {
		filter: drop-shadow(0 0 6px var(--item-accent));
	}

	.nav-label { flex: 1; font-size: 14px; font-weight: 500; }

	.chevron {
		color: var(--text-muted);
		transition: transform 0.25s ease;
		display: flex;
	}

	.chevron.open { transform: rotate(-180deg); }

	.sub-list {
		list-style: none;
		padding: 4px 8px 4px 48px;
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.sub-item {
		border-radius: 8px;
		opacity: 0;
		animation: slideIn 0.22s ease forwards;
	}

	.sub-item a {
		display: block;
		padding: 6px 12px;
		color: var(--text-muted);
		text-decoration: none;
		font-size: 12.5px;
		border-radius: 8px;
		transition: color 0.15s;
	}

	.sub-item a:hover { color: var(--item-accent); }

	@keyframes slideIn {
		from { opacity: 0; transform: translateX(-6px); }
		to   { opacity: 1; transform: translateX(0); }
	}
</style>
