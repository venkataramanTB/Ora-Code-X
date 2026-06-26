<script>
	let {
		elevation = 2,
		state = 'convex',
		radius = 20,
		glow = false,
		glowColor = 'var(--accent-cyan)',
		children,
		class: className = '',
		...rest
	} = $props();
</script>

<div
	class="neo-panel neo-{state} elev-{elevation} {className}"
	style:border-radius="{radius}px"
	style:box-shadow={glow
		? `0 0 28px 4px ${glowColor}40, calc(-${elevation * 2}px) calc(-${elevation * 2}px) calc(${elevation * 4}px) var(--shadow-light), calc(${elevation * 2}px) calc(${elevation * 2}px) calc(${elevation * 4}px) var(--shadow-dark)`
		: undefined}
	{...rest}
>
	{@render children?.()}
</div>

<style>
	.neo-panel {
		background: var(--bg-base);
		position: relative;
	}
</style>
