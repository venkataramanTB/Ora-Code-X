<script>
	import { SignUp } from 'svelte-clerk';
</script>

<svelte:head>
	<title>Sign Up — OraBridgeX Nexus</title>
</svelte:head>

<div class="auth-page">
	<div class="auth-brand">
		<span class="brand-mark">O</span>
		<span class="brand-name">OraBridge<span class="x-char">X</span> <span class="brand-sub">Nexus</span></span>
	</div>

	<SignUp
		signInUrl="/sign-in"
		fallbackRedirectUrl="/"
	/>
</div>

<style>
	.auth-page {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 32px;
		padding: 40px 20px;
	}

	.auth-brand {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.brand-mark {
		width: 44px; height: 44px;
		border-radius: 13px;
		background: linear-gradient(135deg, rgba(var(--accent-primary-rgb), 0.2) 0%, rgba(var(--accent-primary-rgb), 0.06) 100%);
		border: 1px solid rgba(var(--accent-primary-rgb), 0.3);
		display: flex; align-items: center; justify-content: center;
		font-size: 20px; font-weight: 800;
		color: var(--accent-primary);
		text-shadow: 0 0 14px rgba(var(--accent-primary-rgb), 0.7);
		box-shadow: 0 0 20px rgba(var(--accent-primary-rgb), 0.12);
	}

	.brand-name {
		font-size: 22px;
		font-weight: 700;
		color: var(--text-accent);
		letter-spacing: -0.02em;
	}

	.brand-sub {
		font-size: 13px;
		font-weight: 500;
		color: var(--text-muted);
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
</style>
