<script>
	import { Palette, Check } from 'lucide-svelte';
	import { THEMES } from '$lib/data/themes.js';
	import { currentColorId, setColorMode } from '$lib/stores/theme.js';

	let open      = $state(false);
	let wrap      = $state(null);
	let triggerEl = $state(null);
	let panelStyle = $state('');

	function toggle() {
		if (!open && triggerEl) {
			const rect = triggerEl.getBoundingClientRect();
			panelStyle = `top:${rect.bottom + 8}px; right:${window.innerWidth - rect.right}px`;
		}
		open = !open;
	}

	function onWindowClick(e) {
		if (open && wrap && !wrap.contains(e.target)) open = false;
	}

	function onWindowKeydown(e) {
		if (e.key === 'Escape') open = false;
	}

	function pick(id) {
		setColorMode(id);
		open = false;
	}
</script>

<svelte:window onclick={onWindowClick} onkeydown={onWindowKeydown} />

<div class="wrap" bind:this={wrap}>
	<button
		bind:this={triggerEl}
		class="trigger"
		class:is-open={open}
		onclick={toggle}
		aria-label="Change theme"
		aria-expanded={open}
		aria-haspopup="true"
	>
		<Palette size={16} strokeWidth={2} />
	</button>

	{#if open}
		<div class="panel" role="menu" style={panelStyle}>
			<p class="panel-heading">Theme</p>
			<div class="list">
				{#each Object.values(THEMES) as theme (theme.id)}
					<button
						class="item"
						class:is-active={$currentColorId === theme.id}
						role="menuitem"
						onclick={() => pick(theme.id)}
					>
						<span
							class="dot"
							style="background:{theme.accent}; box-shadow:0 0 8px {theme.accent}55"
						></span>
						<span class="item-name">{theme.name}</span>
						{#if $currentColorId === theme.id}
							<span class="checkmark">
								<Check size={11} strokeWidth={3} />
							</span>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.wrap {
		position: relative;
	}

	.trigger {
		background: none;
		border: none;
		cursor: pointer;
		padding: 7px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-muted);
		transition: color 0.15s, background 0.15s;
	}

	.trigger:hover,
	.trigger.is-open {
		color: var(--accent-primary);
		background: rgba(var(--accent-primary-rgb), 0.08);
	}

	/* Fixed so it escapes topbar's overflow:hidden clipping context */
	.panel {
		position: fixed;
		width: 195px;
		background: var(--bg-base);
		border: 1px solid var(--border-subtle);
		border-radius: 16px;
		padding: 10px;
		box-shadow:
			-8px -8px 20px var(--shadow-light),
			 8px  8px 20px var(--shadow-dark),
			 0 0 0 1px var(--border-subtle);
		z-index: 200;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.panel-heading {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-muted);
		padding: 0 6px 2px;
	}

	.list {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.item {
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 7px 8px;
		border-radius: 10px;
		border: 1px solid transparent;
		background: none;
		cursor: pointer;
		width: 100%;
		text-align: left;
		transition: background 0.12s, border-color 0.12s;
	}

	.item:hover {
		background: rgba(var(--accent-primary-rgb), 0.06);
		border-color: var(--border-subtle);
	}

	.item.is-active {
		background: rgba(var(--accent-primary-rgb), 0.1);
		border-color: rgba(var(--accent-primary-rgb), 0.2);
	}

	.dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.item-name {
		font-size: 12.5px;
		font-weight: 500;
		color: var(--text-primary);
		flex: 1;
	}

	.checkmark {
		color: var(--accent-primary);
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}
</style>
