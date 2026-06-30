<script>
	/** @type {{ items: {label: string, href: string}[] }} */
	let { items } = $props();

	/**
	 * Split a label into plain-text and x-char segments without using innerHTML.
	 * Avoids {@html} entirely — labels from props/nav data are trusted but the
	 * pattern is unsafe if labels ever become user-supplied.
	 * @param {string} text
	 * @returns {{ t: 'text'|'x', v?: string }[]}
	 */
	function splitLabel(text) {
		const segments = [];
		const re = /X(?=[a-z]|ion|ing|$)/g;
		let last = 0;
		let match;
		while ((match = re.exec(text)) !== null) {
			if (match.index > last) segments.push({ t: 'text', v: text.slice(last, match.index) });
			segments.push({ t: 'x' });
			last = match.index + 1;
		}
		if (last < text.length) segments.push({ t: 'text', v: text.slice(last) });
		return segments;
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
						<a class="crumb-link" href={item.href}>
							{#each splitLabel(item.label) as seg}
								{#if seg.t === 'x'}<span class="x-char">X</span>{:else}{seg.v}{/if}
							{/each}
						</a>
					{:else}
						<span class="crumb-current" aria-current="page">
							{#each splitLabel(item.label) as seg}
								{#if seg.t === 'x'}<span class="x-char">X</span>{:else}{seg.v}{/if}
							{/each}
						</span>
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
