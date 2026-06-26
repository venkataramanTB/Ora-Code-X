<script>
	import { NAV_ITEMS } from '$lib/data/nav.js';
	import DashboardTile from './DashboardTile.svelte';
</script>

<section class="bento-grid" aria-label="Navigation launchpad">
	{#each NAV_ITEMS as item (item.id)}
		<DashboardTile
			id={item.id}
			label={item.label}
			iconName={item.iconName}
			accent={item.accent}
			accentGlow={item.accentGlow}
			subItems={item.subItems}
			size={item.size}
			gridArea={item.gridArea}
		/>
	{/each}
</section>

<style>
	.bento-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		grid-template-rows: repeat(3, minmax(168px, auto));
		grid-template-areas:
			"delivery  delivery  mytools   workspace"
			"delivery  delivery  monitor   monitor"
			"dashboard admin     admin     admin";
		gap: 18px;
		padding: 20px;
		width: 100%;
		max-width: 1440px;
		margin: 0 auto;
	}

	@media (max-width: 1023px) {
		.bento-grid {
			grid-template-columns: repeat(2, 1fr);
			grid-template-rows: auto;
			grid-template-areas:
				"delivery  delivery"
				"mytools   workspace"
				"monitor   monitor"
				"dashboard admin";
		}
	}

	@media (max-width: 640px) {
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
			gap: 14px;
		}
	}
</style>
