import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';

vi.mock('$app/stores', async () => {
	const { readable } = await import('svelte/store');
	return { page: readable({ url: new URL('http://localhost/') }) };
});

import NavItem from './NavItem.svelte';

const branchWithHref = {
	id: 'delivery',
	label: 'DeliveryX',
	href: '/delivery',
	iconName: 'Rocket',
	accent: '#00d4ff',
	children: [
		{ id: 'conversion', label: 'Smart Genesis ConveX', href: '/delivery/conversion', iconName: 'RefreshCw', children: [] }
	]
};

const leaf = {
	id: 'reports',
	label: 'Report and Analytics',
	href: '/mytools/reports',
	iconName: 'ChartBar',
	children: []
};

describe('NavItem', () => {
	it('renders a branch that also has an href as a button, not a link', () => {
		const { getByRole, queryByRole } = render(NavItem, { props: { node: branchWithHref, depth: 0 } });
		expect(getByRole('button', { name: 'DeliveryX' })).toBeTruthy();
		expect(queryByRole('link', { name: 'DeliveryX' })).toBeNull();
	});

	it('does not show children initially', () => {
		const { queryByRole } = render(NavItem, { props: { node: branchWithHref, depth: 0 } });
		expect(queryByRole('link', { name: 'Smart Genesis ConveX' })).toBeNull();
	});

	it('expands children on click without navigating', async () => {
		const { getByRole, findByRole } = render(NavItem, { props: { node: branchWithHref, depth: 0 } });
		await fireEvent.click(getByRole('button', { name: 'DeliveryX' }));
		expect(await findByRole('link', { name: 'Smart Genesis ConveX' })).toBeTruthy();
	});

	it('collapses children again on a second click', async () => {
		const { getByRole, findByRole, queryByRole } = render(NavItem, { props: { node: branchWithHref, depth: 0 } });
		const button = getByRole('button', { name: 'DeliveryX' });
		await fireEvent.click(button);
		expect(await findByRole('link', { name: 'Smart Genesis ConveX' })).toBeTruthy();
		await fireEvent.click(button);
		expect(queryByRole('link', { name: 'Smart Genesis ConveX' })).toBeNull();
	});

	it('still renders a leaf node (no children) as a plain link', () => {
		const { getByRole } = render(NavItem, { props: { node: leaf, depth: 1 } });
		expect(getByRole('link', { name: 'Report and Analytics' }).getAttribute('href')).toBe('/mytools/reports');
	});
});
