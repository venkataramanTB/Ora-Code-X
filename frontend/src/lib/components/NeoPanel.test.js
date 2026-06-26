import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import NeoPanel from './NeoPanel.svelte';

describe('NeoPanel', () => {
	it('applies neo-convex class by default', () => {
		const { container } = render(NeoPanel, { props: { elevation: 2 } });
		expect(container.firstChild).toHaveClass('neo-convex');
	});

	it('applies neo-concave when state=concave', () => {
		const { container } = render(NeoPanel, { props: { elevation: 2, state: 'concave' } });
		expect(container.firstChild).toHaveClass('neo-concave');
	});

	it('applies correct elevation class', () => {
		const { container } = render(NeoPanel, { props: { elevation: 3 } });
		expect(container.firstChild).toHaveClass('elev-3');
	});

	it('applies border-radius from radius prop', () => {
		const { container } = render(NeoPanel, { props: { elevation: 2, radius: 24 } });
		expect(container.firstChild.style.borderRadius).toBe('24px');
	});
});
