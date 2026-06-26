import { get } from 'svelte/store';
import { describe, it, expect } from 'vitest';
import { mouseX, mouseY } from './mouse.js';

describe('mouse store', () => {
	it('mouseX starts at 0', () => {
		expect(get(mouseX)).toBe(0);
	});
	it('mouseY starts at 0', () => {
		expect(get(mouseY)).toBe(0);
	});
	it('accepts normalized values between -1 and 1', () => {
		mouseX.set(0.5);
		expect(get(mouseX)).toBe(0.5);
		mouseY.set(-0.75);
		expect(get(mouseY)).toBe(-0.75);
	});
});
