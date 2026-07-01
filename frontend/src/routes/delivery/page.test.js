import { render } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';

vi.mock('$app/stores', async () => {
	const { readable } = await import('svelte/store');
	return { page: readable({ url: new URL('http://localhost/delivery') }) };
});

import Page from './+page.svelte';

describe('/delivery page', () => {
	it('renders the DeliveryX hero description exactly', () => {
		const { getByText } = render(Page);
		expect(getByText(
			'A unified suite from Mythics of Oracle Cloud delivery accelerators engineered to simplify implementation, migration, conversion, and integration.'
		)).toBeTruthy();
	});

	it('renders a card for each of DeliveryX\'s children', () => {
		const { getByRole } = render(Page);
		expect(getByRole('link', { name: /IntegraXion/ })).toBeTruthy();
		expect(getByRole('link', { name: /Cross ValidaXion/ })).toBeTruthy();
		expect(getByRole('link', { name: /Cloud ActionX/ })).toBeTruthy();
	});

	it('renders the breadcrumb trail', () => {
		const { getByRole } = render(Page);
		expect(getByRole('navigation', { name: 'Breadcrumb' })).toBeTruthy();
	});
});
