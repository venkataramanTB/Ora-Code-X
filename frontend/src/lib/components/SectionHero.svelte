<script>
	import { ICON_MAP } from '$lib/data/icons.js';

	/** @type {{ tagline: {prefix?: string, title: string, description: string}, node: import('$lib/data/nav.js').NavNode }} */
	let { tagline, node } = $props();

	const Icon = $derived(node.iconName ? (ICON_MAP[node.iconName] ?? null) : null);
	const accent = $derived(node.accent ?? 'var(--accent-primary)');
	const children = $derived(node.children ?? []);

	/** @param {string} text @returns {{ t: 'text'|'x', v?: string }[]} */
	function splitLabel(text) {
		const segments = [];
		const re = /X(?=[a-z]|ion|ing|$)/g;
		let last = 0, match;
		while ((match = re.exec(text)) !== null) {
			if (match.index > last) segments.push({ t: 'text', v: text.slice(last, match.index) });
			segments.push({ t: 'x' });
			last = match.index + 1;
		}
		if (last < text.length) segments.push({ t: 'text', v: text.slice(last) });
		return segments;
	}

	/** @param {import('$lib/data/nav.js').NavNode} n @returns {string} */
	function firstHref(n) {
		if (n.href) return n.href;
		for (const child of n.children ?? []) {
			const found = firstHref(child);
			if (found) return found;
		}
		return '#';
	}
</script>

<section class="section-hero neo-convex elev-3">
	<div class="hero-glow" style="background:{accent}" aria-hidden="true"></div>

	<div class="hero-inner">
		{#if Icon}
			<span class="hero-icon" style:color={accent}>
				<Icon size={34} strokeWidth={1.5} />
			</span>
		{/if}

		<h1 class="hero-title">
			{#if tagline.prefix}<span class="hero-eyebrow">{tagline.prefix}</span>{/if}<span class="hero-name">{#each splitLabel(tagline.title) as seg}{#if seg.t === 'x'}<span class="x-char">X</span>{:else}{seg.v}{/if}{/each}</span>
		</h1>

		<p class="hero-desc">{tagline.description}</p>
	</div>
</section>

{#if children.length}
	<div class="section-grid">
		{#each children as child (child.id)}
			{@const ChildIcon = child.iconName ? ICON_MAP[child.iconName] : null}
			{@const childAccent = child.accent ?? accent}
			<a class="section-card" href={firstHref(child)} style="--acc:{childAccent}">
				<span class="sc-glow" style="background:{childAccent}"></span>

				{#if ChildIcon}
					<span class="sc-icon" style:color={childAccent}>
						<ChildIcon size={22} strokeWidth={1.5} />
					</span>
				{/if}

				<span class="sc-label">{#each splitLabel(child.label) as seg}{#if seg.t === 'x'}<span class="x-char">X</span>{:else}{seg.v}{/if}{/each}</span>

				{#if child.children?.length}
					<span class="sc-badge" style="color:{childAccent};border-color:{childAccent}33">
						{child.children.length}
					</span>
				{/if}
			</a>
		{/each}
	</div>
{/if}

<style>
	.section-hero {
		position: relative;
		border-radius: var(--radius-card, 24px);
		background: var(--bg-base);
		overflow: hidden;
		margin-bottom: 28px;
	}

	.hero-glow {
		position: absolute;
		top: -80px; left: 50%;
		transform: translateX(-50%);
		width: 280px; height: 280px;
		opacity: 0.08;
		pointer-events: none;
		filter: blur(50px);
		border-radius: 50%;
	}

	.hero-inner {
		position: relative;
		z-index: 1;
		padding: 40px 36px 36px;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 14px;
	}

	.hero-icon { display: flex; }

	.hero-title {
		font-size: 28px;
		font-weight: 800;
		color: var(--text-accent);
		letter-spacing: -0.025em;
		line-height: 1.15;
		margin: 0;
	}

	.hero-eyebrow {
		display: block;
		font-size: 12px;
		font-weight: 500;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--text-muted);
		margin-bottom: 4px;
	}

	.hero-desc {
		font-size: 14px;
		color: var(--text-muted);
		line-height: 1.65;
		margin: 0;
		max-width: 640px;
	}

	.section-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
	}

	@media (max-width: 720px) {
		.section-grid { grid-template-columns: repeat(2, 1fr); }
	}

	@media (max-width: 420px) {
		.section-grid { grid-template-columns: 1fr; }
	}

	.section-card {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 20px 12px 18px;
		border-radius: 16px;
		border: 1px solid rgba(var(--accent-primary-rgb), 0.08);
		background: var(--bg-base);
		overflow: hidden;
		text-align: center;
		text-decoration: none;
		transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
		box-shadow:
			-4px -4px 10px var(--shadow-light),
			 4px  4px 10px var(--shadow-dark);
	}

	.section-card:hover {
		border-color: color-mix(in srgb, var(--acc) 40%, transparent);
		box-shadow:
			-4px -4px 10px var(--shadow-light),
			 4px  4px 10px var(--shadow-dark),
			0 0 20px color-mix(in srgb, var(--acc) 18%, transparent);
		transform: translateY(-3px);
	}

	.sc-glow {
		position: absolute;
		inset: 0;
		opacity: 0;
		transition: opacity 0.25s;
		pointer-events: none;
		filter: blur(30px);
	}

	.section-card:hover .sc-glow { opacity: 0.07; }

	.sc-icon {
		display: flex;
		align-items: center;
		position: relative;
		z-index: 1;
		transition: filter 0.2s, transform 0.2s;
	}

	.section-card:hover .sc-icon {
		filter: drop-shadow(0 0 8px var(--acc));
		transform: scale(1.12);
	}

	.sc-label {
		font-size: 12.5px;
		font-weight: 600;
		color: var(--text-muted);
		position: relative;
		z-index: 1;
		transition: color 0.2s;
	}

	.section-card:hover .sc-label { color: var(--text-accent); }

	.sc-badge {
		font-size: 9.5px;
		font-weight: 700;
		padding: 1px 7px;
		border-radius: 6px;
		border: 1px solid;
		letter-spacing: 0.05em;
		position: relative;
		z-index: 1;
		opacity: 0.75;
	}
</style>
