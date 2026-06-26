import { spring } from 'svelte/motion';
import { snappy } from '$lib/motion/springs.js';

export function magnetic(node, options = {}) {
	const { radius = 44, strength = 0.12 } = options;
	let currentX = 0;
	let currentY = 0;

	const txSpring = spring(0, snappy);
	const tySpring = spring(0, snappy);

	const unsubX = txSpring.subscribe(val => {
		currentX = val;
		node.style.transform = `translate(${currentX}px, ${currentY}px)`;
	});

	const unsubY = tySpring.subscribe(val => {
		currentY = val;
		node.style.transform = `translate(${currentX}px, ${currentY}px)`;
	});

	function onWindowMouseMove(e) {
		const rect = node.getBoundingClientRect();
		const cx = rect.left + rect.width / 2;
		const cy = rect.top + rect.height / 2;
		const dx = e.clientX - cx;
		const dy = e.clientY - cy;
		const dist = Math.sqrt(dx * dx + dy * dy);

		if (dist < radius) {
			txSpring.set(dx * strength);
			tySpring.set(dy * strength);
		} else {
			txSpring.set(0);
			tySpring.set(0);
		}
	}

	window.addEventListener('mousemove', onWindowMouseMove);

	return {
		destroy() {
			window.removeEventListener('mousemove', onWindowMouseMove);
			unsubX();
			unsubY();
		}
	};
}
