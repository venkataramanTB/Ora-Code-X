<script>
	import { page } from '$app/stores';
	import { NAV_ITEMS, findNodeByPath } from '$lib/data/nav.js';
	import { ICON_MAP } from '$lib/data/icons.js';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';

	const pathname = $derived($page.url.pathname);
	const result   = $derived(findNodeByPath(pathname));
	const crumbs   = $derived(result?.crumbs ?? []);
	const node     = $derived(result?.node ?? null);

	const segments = $derived(pathname.split('/').filter(Boolean));
	const topItem  = $derived(NAV_ITEMS.find(i => i.id === segments[0]) ?? null);

	const displayTitle = $derived(
		node?.label
		?? crumbs[crumbs.length - 1]?.label
		?? capitalise(segments[segments.length - 1] ?? 'Page')
	);

	const accent = $derived(
		node?.accent
		?? topItem?.accent
		?? 'var(--accent-primary)'
	);

	const IconComp = $derived(
		node?.iconName
			? (ICON_MAP[node.iconName] ?? null)
			: topItem
				? (ICON_MAP[topItem.iconName] ?? null)
				: null
	);

	/** @param {string} s */
	function capitalise(s) {
		return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');
	}

	/** @param {string} text */
	function formatLabel(text) {
		return text.replace(/X(?=[a-z]|ion|ing|$)/g, '<span class="x-char">X</span>');
	}
</script>

<svelte:head>
	<title>{displayTitle} · OraBridgeX Nexus</title>
</svelte:head>

<div class="page-shell">
	<Breadcrumb items={crumbs} />

	<div class="coming-soon">
		<div class="card neo-convex elev-3">
			<div class="glow" style="background:radial-gradient(circle,{accent} 0%,transparent 70%)"></div>

			<div class="inner">
				<span class="badge" style="color:{accent};border-color:{accent}44;background:{accent}11">
					Coming Soon
				</span>

				<div class="title-row">
					{#if IconComp}
						<span class="page-icon" style:color={accent}>
							<IconComp size={34} strokeWidth={1.5} />
						</span>
					{/if}
					<h1 class="title">{@html formatLabel(displayTitle)}</h1>
				</div>

				<p class="subtitle">
					This module is under active development.<br />
					Something powerful is on its way.
				</p>

				<a href="/" class="back-btn">
					← Back to Dashboard
				</a>
			</div>
		</div>
	</div>
</div>

<style>
	.page-shell {
		padding: 32px clamp(16px, 3vw, 48px);
		max-width: 680px;
		margin: 0 auto;
	}

	.coming-soon {
		display: flex;
		align-items: flex-start;
		justify-content: center;
	}

	.card {
		position: relative;
		width: 100%;
		background: var(--bg-base);
		border-radius: var(--radius-card, 24px);
		overflow: hidden;
	}

	.glow {
		position: absolute;
		top: -80px; left: 50%;
		transform: translateX(-50%);
		width: 280px; height: 280px;
		opacity: 0.07;
		pointer-events: none;
		filter: blur(40px);
		border-radius: 50%;
	}

	.inner {
		position: relative;
		z-index: 1;
		padding: 40px 36px 36px;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 14px;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		padding: 4px 12px;
		border-radius: 20px;
		border: 1px solid;
		font-size: 10.5px;
		font-weight: 700;
		letter-spacing: 0.09em;
		text-transform: uppercase;
	}

	.title-row {
		display: flex;
		align-items: center;
		gap: 14px;
	}

	.page-icon { display: flex; flex-shrink: 0; }

	.title {
		font-size: 28px;
		font-weight: 800;
		color: var(--text-accent);
		letter-spacing: -0.025em;
		line-height: 1.15;
		margin: 0;
	}

	.subtitle {
		font-size: 13.5px;
		color: var(--text-muted);
		line-height: 1.65;
		margin: 0;
	}

	.back-btn {
		margin-top: 6px;
		display: inline-flex;
		align-items: center;
		padding: 8px 18px;
		border-radius: 11px;
		border: 1px solid rgba(var(--accent-primary-rgb), 0.22);
		background: rgba(var(--accent-primary-rgb), 0.07);
		color: var(--accent-primary);
		text-decoration: none;
		font-size: 12.5px;
		font-weight: 600;
		letter-spacing: 0.02em;
		transition: background 0.15s, box-shadow 0.15s, border-color 0.15s;
	}

	.back-btn:hover {
		background: rgba(var(--accent-primary-rgb), 0.14);
		border-color: rgba(var(--accent-primary-rgb), 0.4);
		box-shadow: 0 0 14px rgba(var(--accent-primary-rgb), 0.14);
	}
</style>
