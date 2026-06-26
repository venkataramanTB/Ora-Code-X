import { spring } from 'svelte/motion';
import { snappy } from '$lib/motion/springs.js';

export function tilt(node, options = {}) {
	let maxAngle = options.maxAngle ?? 3;
	let baseZ    = options.baseZ    ?? 0;   // resting depth (px) within parent perspective
	let hoverZ   = options.hoverZ   ?? 22;  // extra Z lift on hover

	// local tracking vars — updated by each spring subscription
	let rx = 0, ry = 0, tz = baseZ;

	const rxSpring = spring(0,      snappy);
	const rySpring = spring(0,      snappy);
	const tzSpring = spring(baseZ,  { stiffness: 0.14, damping: 0.78 });

	node.style.transformStyle = 'preserve-3d';

	function apply() {
		node.style.setProperty('--tilt-x', String(Math.round(rx * 100) / 100));
		node.style.setProperty('--tilt-y', String(Math.round(ry * 100) / 100));
		// translateZ first so Z-lift is in parent-space, then rotations tilt the card face
		node.style.transform = `translateZ(${tz}px) rotateX(${rx}deg) rotateY(${ry}deg)`;
	}

	const unsubRx = rxSpring.subscribe(v => { rx = v; apply(); });
	const unsubRy = rySpring.subscribe(v => { ry = v; apply(); });
	const unsubTz = tzSpring.subscribe(v => { tz = v; apply(); });

	function onMouseMove(e) {
		const rect = node.getBoundingClientRect();
		const cx   = rect.left + rect.width  / 2;
		const cy   = rect.top  + rect.height / 2;
		rxSpring.set(-((e.clientY - cy) / (rect.height / 2)) * maxAngle);
		rySpring.set( ((e.clientX - cx) / (rect.width  / 2)) * maxAngle);
		tzSpring.set(baseZ + hoverZ);
	}

	function onMouseLeave() {
		rxSpring.set(0);
		rySpring.set(0);
		tzSpring.set(baseZ);
	}

	node.addEventListener('mousemove',  onMouseMove);
	node.addEventListener('mouseleave', onMouseLeave);

	return {
		update(newOpts) {
			maxAngle = newOpts.maxAngle ?? 3;
			baseZ    = newOpts.baseZ    ?? 0;
			hoverZ   = newOpts.hoverZ   ?? 22;
			tzSpring.set(baseZ, { hard: true });
		},
		destroy() {
			node.removeEventListener('mousemove',  onMouseMove);
			node.removeEventListener('mouseleave', onMouseLeave);
			unsubRx(); unsubRy(); unsubTz();
		}
	};
}
