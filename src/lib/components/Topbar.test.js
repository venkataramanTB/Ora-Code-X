import { render } from '@testing-library/svelte';
import { describe, it, expect, beforeEach } from 'vitest';
import { scrolled } from '$lib/stores/theme.js';
import Topbar from './Topbar.svelte';

beforeEach(() => scrolled.set(false));

describe('Topbar', () => {
	it('renders the logo', () => {
		const { getAllByText } = render(Topbar);
		expect(getAllByText(/OraCode/).length).toBeGreaterThan(0);
	});

	it('shows nav when not scrolled', () => {
		const { getByRole } = render(Topbar);
		expect(getByRole('navigation', { name: 'Top navigation' })).toBeTruthy();
	});

	it('shows hamburger when scrolled', async () => {
		scrolled.set(true);
		const { findByLabelText } = render(Topbar);
		expect(await findByLabelText('Open navigation')).toBeTruthy();
	});

	it('hides nav when scrolled', () => {
		scrolled.set(true);
		const { queryByRole } = render(Topbar);
		expect(queryByRole('navigation', { name: 'Top navigation' })).toBeNull();
	});
});
