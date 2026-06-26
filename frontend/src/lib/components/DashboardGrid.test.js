import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import DashboardGrid from './DashboardGrid.svelte';

describe('DashboardGrid', () => {
	it('renders 6 tiles', () => {
		const { getAllByRole } = render(DashboardGrid);
		expect(getAllByRole('button').length).toBe(6);
	});

	it('renders DeliveryX hero', () => {
		const { getByLabelText } = render(DashboardGrid);
		expect(getByLabelText('DeliveryX')).toBeTruthy();
	});

	it('renders all section labels', () => {
		const { getByText } = render(DashboardGrid);
		['My Tools', 'Work Space', 'Monitoring', 'Dashboard', 'Administration'].forEach(l => {
			expect(getByText(l)).toBeTruthy();
		});
	});
});
