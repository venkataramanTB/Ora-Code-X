import { derived } from 'svelte/store';
import { mouseX, mouseY } from '$lib/stores/mouse.js';

const mousePos = derived([mouseX, mouseY], ([$x, $y]) => ({ x: $x, y: $y }));

export function parallax(node, depth = 0.05) {
	let d = depth;

	const unsub = mousePos.subscribe(({ x, y }) => {
		const dx = x * 120 * d;
		const dy = y * 80 * d;
		node.style.transform = `translate(${dx}px, ${dy}px)`;
	});

	return {
		update(newDepth) { d = newDepth; },
		destroy() { unsub(); }
	};
}
