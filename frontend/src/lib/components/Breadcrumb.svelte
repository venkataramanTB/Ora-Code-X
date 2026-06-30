<script>
	/** @type {{ items: {label: string, href: string}[] }} */
	let { items } = $props();

	/** @param {string} text */
	function formatLabel(text) {
		return text.replace(/X(?=[a-z]|ion|ing|$)/g, '<span class="x-char">X</span>');
	}
</script>

{#if items.length > 0}
	<nav class="breadcrumb" aria-label="Breadcrumb">
		<ol class="crumb-list">
			<li class="crumb-item">
				<a class="crumb-link" href="/">Home</a>
			</li>
			{#each items as item, i}
				<li class="crumb-sep" aria-hidden="true">/</li>
				<li class="crumb-item">
					{#if i < items.length - 1}
						<a class="crumb-link" href={item.href}>{@html formatLabel(item.label)}</a>
					{:else}
						<span class="crumb-current" aria-current="page">{@html formatLabel(item.label)}</span>
					{/if}
				</li>
			{/each}
		</ol>
	</nav>
{/if}

<style>
	.breadcrumb { margin-bottom: 20px; }

	.crumb-list {
		list-style: none;
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 2px 4px;
		padding: 0;
		margin: 0;
	}

	.crumb-item { display: flex; align-items: center; }

	.crumb-sep {
		color: var(--text-muted);
		font-size: 12px;
		opacity: 0.4;
		user-select: none;
		padding: 0 2px;
	}

	.crumb-link {
		font-size: 12px;
		color: var(--text-muted);
		text-decoration: none;
		border-radius: 5px;
		padding: 2px 5px;
		transition: color 0.14s, background 0.14s;
	}

	.crumb-link:hover {
		color: var(--accent-primary);
		background: rgba(255, 255, 255, 0.04);
	}

	.crumb-current {
		font-size: 12px;
		color: var(--text-primary);
		font-weight: 600;
		padding: 2px 5px;
	}
</style>
