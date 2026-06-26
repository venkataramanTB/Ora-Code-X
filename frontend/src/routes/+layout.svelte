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
			colorBackground:        '#13171f',
			colorInputBackground:   '#161b25',
			colorPrimary:           '#00d4ff',
			colorPrimaryForeground: '#0a0e14',
			colorText:              '#c8d0e0',
			colorTextSecondary:     '#6b7a99',
			colorNeutral:           '#6b7a99',
			borderRadius:           '14px',
			fontFamily:             '"Inter", -apple-system, sans-serif',
			fontSize:               '14px',
		},
		elements: {
			card: {
				background: 'linear-gradient(135deg,rgba(22,28,38,0.98) 0%,rgba(18,22,30,1) 100%)',
				boxShadow:  '-12px -12px 24px rgba(255,255,255,0.045),12px 12px 24px rgba(0,0,0,0.55)',
				border:     '1px solid rgba(255,255,255,0.06)',
			},
			formButtonPrimary: {
				background:  'linear-gradient(135deg,rgba(0,212,255,0.18),rgba(0,212,255,0.32))',
				border:      '1px solid rgba(0,212,255,0.4)',
				color:       '#00d4ff',
				boxShadow:   '0 0 18px rgba(0,212,255,0.15)',
			},
			footerActionLink:    { color: '#00d4ff' },
			identityPreviewText: { color: '#c8d0e0' },
		}
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
