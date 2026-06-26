import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import NavItem from './NavItem.svelte';

const props = {
	id: 'delivery', label: 'DeliveryX', iconName: 'Rocket',
	accent: '#00d4ff',
	subItems: [{ label: 'Sub Item', href: '/sub' }],
	expandable: true
};

describe('NavItem', () => {
	it('renders the label', () => {
		const { getByText } = render(NavItem, { props });
		expect(getByText(/Delivery/)).toBeTruthy();
	});

	it('does not show sub-items initially', () => {
		const { queryByText } = render(NavItem, { props });
		expect(queryByText('Sub Item')).toBeNull();
	});

	it('shows sub-items after clicking', async () => {
		const { getByRole, findByText } = render(NavItem, { props });
		await fireEvent.click(getByRole('button'));
		expect(await findByText('Sub Item')).toBeTruthy();
	});
});
