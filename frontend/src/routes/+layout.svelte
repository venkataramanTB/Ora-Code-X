<script>
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { ClerkProvider } from 'svelte-clerk';
	import { mouseX, mouseY } from '$lib/stores/mouse.js';
	import { scrolled } from '$lib/stores/theme.js';
	import OrbBackground from '$lib/components/OrbBackground.svelte';
	import Topbar from '$lib/components/Topbar.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';

	let { children } = $props();

	const SCROLL_THRESHOLD = 72;

	const isAuthRoute = $derived(
		$page.url.pathname.startsWith('/sign-in') ||
		$page.url.pathname.startsWith('/sign-up')
	);

	const clerkAppearance = {
		variables: {
			colorBackground:        '#111620',
			colorInputBackground:   '#0d1117',
			colorInputText:         '#e8edf5',
			colorPrimary:           '#00d4ff',
			colorPrimaryForeground: '#0a0e14',
			colorText:              '#e8edf5',
			colorTextSecondary:     '#6b7a99',
			colorNeutral:           '#4a5568',
			colorDanger:            '#ff4d6d',
			borderRadius:           '12px',
			fontFamily:             '"Inter", -apple-system, sans-serif',
			fontSize:               '14px',
			spacingUnit:            '16px',
		},
	};

	onMount(() => {
		function onMouseMove(e) {
			mouseX.set((e.clientX / window.innerWidth)  * 2 - 1);
			mouseY.set((e.clientY / window.innerHeight) * 2 - 1);
		}
		function onScroll() {
			scrolled.set(window.scrollY > SCROLL_THRESHOLD);
		}

		window.addEventListener('mousemove', onMouseMove, { passive: true });
		window.addEventListener('scroll',    onScroll,    { passive: true });
		onScroll();

		return () => {
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('scroll',    onScroll);
		};
	});
</script>

<ClerkProvider appearance={clerkAppearance}>
	<OrbBackground />

	{#if !isAuthRoute}
		<Topbar />
		<Sidebar />
	{/if}

	<main class:auth-main={isAuthRoute} class="main-content">
		{@render children()}
	</main>
</ClerkProvider>

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

	.auth-main {
		padding-top: 0;
		justify-content: center;
	}
</style>
