<script>
	import '../app.css';

	import { PUBLIC_CLERK_PUBLISHABLE_KEY } from '$env/static/public';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { onNavigate } from '$app/navigation';

	import { ClerkProvider } from 'svelte-clerk';

	import { mouseX, mouseY } from '$lib/stores/mouse.js';
	import {
		scrolled,
		clerkVars,
		initTheme
	} from '$lib/stores/theme.js';
	import { sidebarOpen } from '$lib/stores/navigation.js';

	import OrbBackground from '$lib/components/OrbBackground.svelte';
	import Topbar from '$lib/components/Topbar.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import ConnectionHealthMonitor from '$lib/components/ConnectionHealthMonitor.svelte';

	let { data, children } = $props();

	const SCROLL_THRESHOLD = 72;

	const isAuthRoute = $derived(
		$page.url.pathname.startsWith('/sign-in') ||
		$page.url.pathname.startsWith('/sign-up')
	);

	const clerkAppearance = $derived({
		variables: {
			...$clerkVars,
			borderRadius: '12px',
			fontFamily: '"Inter", -apple-system, sans-serif',
			fontSize: '14px',
			spacingUnit: '16px'
		}
	});

	function navDepth(path) {
		return path.split('/').filter(Boolean).length;
	}

	onNavigate((nav) => {
		sidebarOpen.set(false);

		if (!document.startViewTransition) return;

		const fromDepth = navDepth(nav.from?.url.pathname ?? '/');
		const toDepth = navDepth(nav.to?.url.pathname ?? '/');

		document.documentElement.dataset.navDir =
			toDepth < fromDepth ? 'back' : 'forward';

		return new Promise((resolve) => {
			const vt = document.startViewTransition(async () => {
				resolve();
				await nav.complete;
			});

			vt.finished.finally(() => {
				delete document.documentElement.dataset.navDir;
			});
		});
	});

	onMount(() => {
		initTheme();

		function onMouseMove(e) {
			mouseX.set((e.clientX / window.innerWidth) * 2 - 1);
			mouseY.set((e.clientY / window.innerHeight) * 2 - 1);
		}

		function onScroll() {
			scrolled.set(window.scrollY > SCROLL_THRESHOLD);
		}

		window.addEventListener('mousemove', onMouseMove, { passive: true });
		window.addEventListener('scroll', onScroll, { passive: true });

		onScroll();

		return () => {
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('scroll', onScroll);
		};
	});
</script>

<ClerkProvider
	{data}
	publishableKey={PUBLIC_CLERK_PUBLISHABLE_KEY}
	appearance={clerkAppearance}
>
	<OrbBackground />
	<ConnectionHealthMonitor />

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
		align-items: stretch;
		width: 100%;
	}

	.auth-main {
		padding-top: 0;
		justify-content: center;
	}
</style>