<script>
	import { NAV_ITEMS } from '$lib/data/nav.js';
	import DashboardTile from './DashboardTile.svelte';
</script>

<section class="bento-grid" aria-label="Navigation launchpad">
	{#each NAV_ITEMS as item, i (item.id)}
		<DashboardTile
			id={item.id}
			label={item.label}
			iconName={item.iconName}
			accent={item.accent}
			accentGlow={item.accentGlow}
			subItems={item.subItems}
			size={item.size}
			gridArea={item.gridArea}
			entryDelay={i * 70}
		/>
	{/each}
</section>

<style>
	.bento-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		grid-template-rows: repeat(3, minmax(176px, auto));
		grid-template-areas:
			"delivery  delivery  mytools   workspace"
			"delivery  delivery  monitor   monitor"
			"dashboard admin     admin     admin";
		gap: clamp(12px, 1.6vw, 20px);
		padding: clamp(12px, 2vw, 24px);
		width: 100%;
		max-width: 1440px;
		margin: 0 auto;

		/* Shared perspective — all tiles exist in one 3D scene */
		perspective: 1600px;
		perspective-origin: 50% -8%;
	}

	/* ── Tablet ─── */
	@media (max-width: 1023px) {
		.bento-grid {
			grid-template-columns: repeat(2, 1fr);
			grid-template-rows: auto;
			grid-template-areas:
				"delivery  delivery"
				"mytools   workspace"
				"monitor   monitor"
				"dashboard admin";
			perspective: 1200px;
		}
	}

	/* ── Mobile ─── */
	@media (max-width: 600px) {
		.bento-grid {
			grid-template-columns: 1fr;
			grid-template-areas:
				"delivery"
				"mytools"
				"workspace"
				"monitor"
				"dashboard"
				"admin";
			padding: 12px;
			gap: 12px;
			perspective: none; /* flat on small screens */
		}
	}
</style>
