<script>
	import { page } from '$app/stores';
	import { NAV_ITEMS } from '$lib/data/nav.js';

	const segments = $derived($page.url.pathname.split('/').filter(Boolean));

	const module = $derived(NAV_ITEMS.find(item => item.id === segments[0]));

	const subItem = $derived(
		module && segments[1]
			? (module.subItems ?? []).find(s => s.href?.endsWith('/' + segments[1]))
			: null
	);

	const displayTitle = $derived(
		subItem ? subItem.label : (module?.label ?? capitalise(segments[0] ?? 'page'))
	);

	const moduleAccent = $derived(module?.accent ?? 'var(--accent-primary)');

	function capitalise(s) {
		return s.charAt(0).toUpperCase() + s.slice(1);
	}
</script>

<svelte:head>
	<title>{displayTitle} — Coming Soon · OraCodeX Studio</title>
</svelte:head>

<div class="coming-soon">
	<div class="card">
		<!-- Ambient glow behind card -->
		<div class="glow" style="background: radial-gradient(circle, {moduleAccent} 0%, transparent 70%)"></div>

		<div class="inner">
			<span class="badge" style="color:{moduleAccent}; border-color:{moduleAccent}44; background:{moduleAccent}11">
				Coming Soon
			</span>

			<h1 class="title">{displayTitle}</h1>

			<p class="subtitle">
				This module is under active development.<br />
				Something powerful is on its way.
			</p>

			{#if module?.subItems?.length}
				<div class="subitems">
					<p class="subitems-label">What's coming:</p>
					<ul>
						{#each module.subItems as sub}
							<li style="--dot-color:{moduleAccent}">{sub.label}</li>
						{/each}
					</ul>
				</div>
			{/if}

			<a href="/" class="back-btn" style="--btn-accent-rgb:{moduleAccent}">
				← Back to Dashboard
			</a>
		</div>
	</div>
</div>

<style>
	.coming-soon {
		min-height: calc(100vh - 120px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 40px 20px;
	}

	.card {
		position: relative;
		max-width: 480px;
		width: 100%;
		background: var(--bg-base);
		border-radius: 24px;
		box-shadow:
			-16px -16px 32px var(--shadow-light),
			 16px  16px 32px var(--shadow-dark),
			 0 0 0 1px var(--border-subtle);
		overflow: hidden;
	}

	.glow {
		position: absolute;
		top: -80px;
		left: 50%;
		transform: translateX(-50%);
		width: 300px;
		height: 300px;
		opacity: 0.06;
		pointer-events: none;
		filter: blur(40px);
		border-radius: 50%;
	}

	.inner {
		position: relative;
		z-index: 1;
		padding: 48px 40px 40px;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 16px;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		padding: 4px 12px;
		border-radius: 20px;
		border: 1px solid;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.title {
		font-size: 32px;
		font-weight: 800;
		color: var(--text-accent);
		letter-spacing: -0.03em;
		line-height: 1.1;
		margin: 0;
	}

	.subtitle {
		font-size: 14px;
		color: var(--text-muted);
		line-height: 1.6;
		margin: 0;
	}

	.subitems {
		margin-top: 4px;
		padding: 16px;
		background: rgba(255, 255, 255, 0.025);
		border-radius: 14px;
		border: 1px solid var(--border-subtle);
		width: 100%;
	}

	.subitems-label {
		font-size: 10.5px;
		font-weight: 700;
		letter-spacing: 0.07em;
		text-transform: uppercase;
		color: var(--text-muted);
		margin-bottom: 10px;
	}

	.subitems ul {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.subitems li {
		font-size: 13px;
		color: var(--text-primary);
		padding-left: 16px;
		position: relative;
	}

	.subitems li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%);
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--dot-color, var(--accent-primary));
		opacity: 0.6;
	}

	.back-btn {
		margin-top: 8px;
		display: inline-flex;
		align-items: center;
		padding: 9px 20px;
		border-radius: 12px;
		border: 1px solid rgba(var(--accent-primary-rgb), 0.22);
		background: rgba(var(--accent-primary-rgb), 0.07);
		color: var(--accent-primary);
		text-decoration: none;
		font-size: 13px;
		font-weight: 600;
		letter-spacing: 0.02em;
		transition: background 0.15s, box-shadow 0.15s, border-color 0.15s;
	}

	.back-btn:hover {
		background: rgba(var(--accent-primary-rgb), 0.14);
		border-color: rgba(var(--accent-primary-rgb), 0.4);
		box-shadow: 0 0 14px rgba(var(--accent-primary-rgb), 0.15);
	}
</style>
