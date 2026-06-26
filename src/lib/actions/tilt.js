import { spring } from 'svelte/motion';
import { get } from 'svelte/store';
import { snappy } from '$lib/motion/springs.js';

export function tilt(node, options = {}) {
	let maxAngle = options.maxAngle ?? 8;

	const rxSpring = spring(0, snappy);
	const rySpring = spring(0, snappy);

	node.style.setProperty('--tilt-x', '0');
	node.style.setProperty('--tilt-y', '0');
	node.style.transformStyle = 'preserve-3d';

	const unsubRx = rxSpring.subscribe(val => {
		node.style.setProperty('--tilt-x', String(Math.round(val * 100) / 100));
		node.style.transform = `perspective(1000px) rotateX(${val}deg) rotateY(${get(rySpring)}deg)`;
	});

	const unsubRy = rySpring.subscribe(val => {
		node.style.setProperty('--tilt-y', String(Math.round(val * 100) / 100));
		node.style.transform = `perspective(1000px) rotateX(${get(rxSpring)}deg) rotateY(${val}deg)`;
	});

	function onMouseMove(e) {
		const rect = node.getBoundingClientRect();
		const cx = rect.left + rect.width / 2;
		const cy = rect.top + rect.height / 2;
		const relX = (e.clientX - cx) / (rect.width / 2);
		const relY = (e.clientY - cy) / (rect.height / 2);
		rxSpring.set(-relY * maxAngle);
		rySpring.set(relX * maxAngle);
	}

	function onMouseLeave() {
		rxSpring.set(0);
		rySpring.set(0);
	}

	node.addEventListener('mousemove', onMouseMove);
	node.addEventListener('mouseleave', onMouseLeave);

	return {
		update(newOptions) {
			maxAngle = newOptions.maxAngle ?? 8;
		},
		destroy() {
			node.removeEventListener('mousemove', onMouseMove);
			node.removeEventListener('mouseleave', onMouseLeave);
			unsubRx();
			unsubRy();
		}
	};
}
