<script>
	import { page } from '$app/stores';
	import { findNodeByPath, DELIVERY_TAGLINE } from '$lib/data/nav.js';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import SectionHero from '$lib/components/SectionHero.svelte';

	const result = $derived(findNodeByPath($page.url.pathname));
	const crumbs = $derived(result?.crumbs ?? []);
	const node = $derived(result?.node);
</script>

<svelte:head>
	<title>DeliveryX · OraBridgeX Nexus</title>
</svelte:head>

<div class="page-shell">
	<Breadcrumb items={crumbs} />
	{#if node}
		<SectionHero tagline={DELIVERY_TAGLINE} {node} />
	{/if}
</div>

<style>
	.page-shell {
		padding: 32px clamp(16px, 3vw, 48px);
		max-width: 1100px;
		margin: 0 auto;
	}
</style>
