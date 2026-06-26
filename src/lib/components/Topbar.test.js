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

	it('shows nav links when not scrolled', () => {
		const { getAllByRole } = render(Topbar);
		expect(getAllByRole('link').length).toBeGreaterThan(0);
	});

	it('shows hamburger when scrolled', async () => {
		scrolled.set(true);
		const { findByLabelText } = render(Topbar);
		expect(await findByLabelText('Open navigation')).toBeTruthy();
	});

	it('hides nav links when scrolled', () => {
		scrolled.set(true);
		const { queryAllByRole } = render(Topbar);
		expect(queryAllByRole('link').length).toBe(0);
	});
});
