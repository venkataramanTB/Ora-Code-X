import { render } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';

vi.mock('$app/stores', async () => {
	const { readable } = await import('svelte/store');
	return { page: readable({ url: new URL('http://localhost/delivery/conversion') }) };
});

import Page from './+page.svelte';

describe('/delivery/conversion page', () => {
	it('renders the Smart Genesis ConveX hero text exactly', () => {
		const { getByText } = render(Page);
		expect(getByText(
			'The next generation Oracle Cloud conversion engine that transforms enterprise data into cloud-ready intelligence through precision-driven transformation.'
		)).toBeTruthy();
	});

	it('renders no child card grid', () => {
		const { queryAllByRole } = render(Page);
		expect(queryAllByRole('link', { name: /Smart Genesis ConveX/ })).toHaveLength(0);
	});

	it('renders the breadcrumb trail back to DeliveryX', () => {
		const { getByRole } = render(Page);
		expect(getByRole('link', { name: 'DeliveryX' })).toBeTruthy();
	});
});
