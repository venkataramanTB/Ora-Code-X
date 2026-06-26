import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tilt } from './tilt.js';

function makeNode() {
	const node = document.createElement('div');
	Object.defineProperty(node, 'getBoundingClientRect', {
		value: () => ({ left: 100, top: 100, width: 200, height: 200 })
	});
	document.body.appendChild(node);
	return node;
}

describe('tilt action', () => {
	let node;
	beforeEach(() => {
		node = makeNode();
	});

	it('initializes --tilt-x to 0', () => {
		tilt(node);
		expect(node.style.getPropertyValue('--tilt-x')).toBe('0');
	});

	it('initializes --tilt-y to 0', () => {
		tilt(node);
		expect(node.style.getPropertyValue('--tilt-y')).toBe('0');
	});

	it('returns a destroy function', () => {
		const instance = tilt(node);
		expect(typeof instance.destroy).toBe('function');
	});

	it('cleans up listeners on destroy', () => {
		const spy = vi.spyOn(node, 'removeEventListener');
		const instance = tilt(node);
		instance.destroy();
		expect(spy).toHaveBeenCalledWith('mousemove', expect.any(Function));
		expect(spy).toHaveBeenCalledWith('mouseleave', expect.any(Function));
	});
});
