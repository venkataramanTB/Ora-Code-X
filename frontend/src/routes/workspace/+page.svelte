<script>
	import { SvelteFlow, Controls, Background, MiniMap, BackgroundVariant } from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';

	/** @type {import('@xyflow/svelte').Node[]} */
	let nodes = $state([
		{
			id: 'source',
			type: 'input',
			position: { x: 40, y: 180 },
			data: { label: 'Oracle ERP Source' },
		},
		{
			id: 'extract',
			position: { x: 280, y: 60 },
			data: { label: 'Extract' },
		},
		{
			id: 'validate',
			position: { x: 280, y: 300 },
			data: { label: 'Validate' },
		},
		{
			id: 'transform',
			position: { x: 520, y: 180 },
			data: { label: 'Transform' },
		},
		{
			id: 'monitor',
			position: { x: 520, y: 380 },
			data: { label: 'Monitor' },
		},
		{
			id: 'target',
			type: 'output',
			position: { x: 760, y: 180 },
			data: { label: 'Cloud Target' },
		},
	]);

	/** @type {import('@xyflow/svelte').Edge[]} */
	let edges = $state([
		{ id: 'e-src-ext', source: 'source', target: 'extract', animated: true },
		{ id: 'e-src-val', source: 'source', target: 'validate' },
		{ id: 'e-ext-xfm', source: 'extract', target: 'transform', animated: true },
		{ id: 'e-val-xfm', source: 'validate', target: 'transform' },
		{ id: 'e-xfm-tgt', source: 'transform', target: 'target', animated: true },
		{ id: 'e-xfm-mon', source: 'transform', target: 'monitor' },
	]);
</script>

<svelte:head>
	<title>Work Space · OraBridgeX Nexus</title>
</svelte:head>

<div class="workspace-shell">
	<SvelteFlow bind:nodes bind:edges fitView colorMode="dark">
		<Background variant={BackgroundVariant.Dots} gap={20} size={1.2} />
		<Controls />
		<MiniMap zoomable pannable />
	</SvelteFlow>
</div>

<style>
	.workspace-shell {
		width: 100%;
		flex: 1;
		min-height: calc(100dvh - 120px);
	}

	/* ── Blend XYFlow dark nodes with our design token colours ── */
	:global(.svelte-flow) {
		--xy-background-color: var(--bg-base);
		--xy-background-pattern-color: rgba(255, 255, 255, 0.06);
		--xy-node-border-radius: 10px;
		--xy-controls-button-background-color: var(--bg-raise, #1a1a2e);
		--xy-controls-button-color: var(--text-muted);
		--xy-controls-button-border-color: rgba(255, 255, 255, 0.08);
		--xy-minimap-background-color: var(--bg-base);
		--xy-minimap-mask-background-color: rgba(0, 0, 0, 0.4);
	}
</style>
