<script>
	import '../app.css';
	import { onMount } from 'svelte';
	import { mouseX, mouseY } from '$lib/stores/mouse.js';
	import { scrolled } from '$lib/stores/theme.js';
	import OrbBackground from '$lib/components/OrbBackground.svelte';
	import Topbar from '$lib/components/Topbar.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';

	let { children } = $props();

	let sentinel;

	onMount(() => {
		// Normalize mouse position to [-1, 1] range for parallax actions
		function onMouseMove(e) {
			mouseX.set((e.clientX / window.innerWidth)  * 2 - 1);
			mouseY.set((e.clientY / window.innerHeight) * 2 - 1);
		}
		window.addEventListener('mousemove', onMouseMove, { passive: true });

		// Scroll sentinel at 80px — drives topbar compression
		const observer = new IntersectionObserver(
			([entry]) => scrolled.set(!entry.isIntersecting),
			{ rootMargin: '0px', threshold: 0 }
		);
		if (sentinel) observer.observe(sentinel);

		return () => {
			window.removeEventListener('mousemove', onMouseMove);
			observer.disconnect();
		};
	});
</script>

<OrbBackground />
<Topbar />
<Sidebar />

<!-- Sentinel sits 80px below the top; when it scrolls out, topbar compresses -->
<div bind:this={sentinel} class="scroll-sentinel" aria-hidden="true"></div>

<main class="main-content">
	{@render children()}
</main>

<style>
	.scroll-sentinel {
		position: absolute;
		top: 80px;
		left: 0;
		width: 1px;
		height: 1px;
		pointer-events: none;
	}

	.main-content {
		position: relative;
		z-index: 1;
		min-height: 100vh;
		padding-top: 72px; /* clear floating topbar */
		display: flex;
		flex-direction: column;
		align-items: center;
	}
</style>
