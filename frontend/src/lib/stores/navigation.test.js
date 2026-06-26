import { get } from 'svelte/store';
import { describe, it, expect, beforeEach } from 'vitest';
import { sidebarOpen, activeSection, expandedSections } from './navigation.js';

beforeEach(() => {
	sidebarOpen.set(false);
	activeSection.set('');
	expandedSections.set(new Set());
});

describe('sidebarOpen', () => {
	it('starts false', () => {
		expect(get(sidebarOpen)).toBe(false);
	});
	it('toggles to true', () => {
		sidebarOpen.update(v => !v);
		expect(get(sidebarOpen)).toBe(true);
	});
});

describe('expandedSections', () => {
	it('starts empty', () => {
		expect(get(expandedSections).size).toBe(0);
	});
	it('can add a section id', () => {
		expandedSections.update(s => { s.add('delivery'); return s; });
		expect(get(expandedSections).has('delivery')).toBe(true);
	});
	it('can remove a section id', () => {
		expandedSections.update(s => { s.add('delivery'); return s; });
		expandedSections.update(s => { s.delete('delivery'); return s; });
		expect(get(expandedSections).has('delivery')).toBe(false);
	});
});
