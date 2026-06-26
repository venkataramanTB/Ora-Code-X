<script>
	import { parallax } from '$lib/actions/parallax.js';
</script>

<div class="orb-container" aria-hidden="true">
	<div class="orb orb-1" use:parallax={0.015}></div>
	<div class="orb orb-2" use:parallax={0.02}></div>
	<div class="orb orb-3" use:parallax={0.01}></div>
</div>

<style>
	.orb-container {
		position: fixed;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		overflow: hidden;
		/* Floats above the page content transition — orbs don't animate between pages */
		view-transition-name: orbs;
	}

	.orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(90px);
		opacity: var(--orb-opacity, 0.07);
		will-change: transform;
	}

	.orb-1 {
		width: 700px;
		height: 700px;
		top: -250px;
		right: -150px;
		background: radial-gradient(circle at center, var(--orb-1, #00d4ff), transparent 70%);
		animation: drift1 90s ease-in-out infinite;
	}

	.orb-2 {
		width: 550px;
		height: 550px;
		bottom: -180px;
		left: -120px;
		background: radial-gradient(circle at center, var(--orb-2, #f5a623), transparent 70%);
		animation: drift2 75s ease-in-out infinite;
	}

	.orb-3 {
		width: 450px;
		height: 450px;
		top: 35%;
		left: 28%;
		background: radial-gradient(circle at center, var(--orb-3, #3c1478), transparent 70%);
		animation: drift3 110s ease-in-out infinite;
	}
</style>
