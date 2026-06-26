<script>
	import '../app.css';
	import { onMount } from 'svelte';
	import { mouseX, mouseY } from '$lib/stores/mouse.js';
	import { scrolled } from '$lib/stores/theme.js';
	import OrbBackground from '$lib/components/OrbBackground.svelte';
	import Topbar from '$lib/components/Topbar.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';

	let { children } = $props();

	const SCROLL_THRESHOLD = 72;

	onMount(() => {
		function onMouseMove(e) {
			mouseX.set((e.clientX / window.innerWidth)  * 2 - 1);
			mouseY.set((e.clientY / window.innerHeight) * 2 - 1);
		}

		function onScroll() {
			scrolled.set(window.scrollY > SCROLL_THRESHOLD);
		}

		window.addEventListener('mousemove', onMouseMove, { passive: true });
		window.addEventListener('scroll', onScroll, { passive: true });

		// Set initial state in case page loads mid-scroll
		onScroll();

		return () => {
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('scroll', onScroll);
		};
	});
</script>

<OrbBackground />
<Topbar />
<Sidebar />

<main class="main-content">
	{@render children()}
</main>

<style>
	.main-content {
		position: relative;
		z-index: 1;
		min-height: 100vh;
		padding-top: 120px;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
</style>
