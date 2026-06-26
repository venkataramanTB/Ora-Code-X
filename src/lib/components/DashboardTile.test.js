import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import DashboardTile from './DashboardTile.svelte';

const heroProps = {
	id: 'delivery', label: 'DeliveryX', iconName: 'Rocket',
	accent: '#00d4ff', accentGlow: 'rgba(0,212,255,0.15)',
	subItems: [{ label: 'SubA', href: '/a' }, { label: 'SubB', href: '/b' }],
	size: 'hero', gridArea: 'delivery'
};
const smallProps = {
	id: 'mytools', label: 'My Tools', iconName: 'Wrench',
	accent: '#f5a623', accentGlow: 'rgba(245,166,35,0.15)',
	subItems: [{ label: 'Tool1', href: '/t1' }],
	size: 'small', gridArea: 'mytools'
};

describe('DashboardTile', () => {
	it('renders the label', () => {
		const { getByText } = render(DashboardTile, { props: smallProps });
		expect(getByText('My Tools')).toBeTruthy();
	});

	it('hero tile shows sub-items without clicking', () => {
		const { getByText } = render(DashboardTile, { props: heroProps });
		expect(getByText('SubA')).toBeTruthy();
	});

	it('small tile hides sub-items initially', () => {
		const { queryByText } = render(DashboardTile, { props: smallProps });
		expect(queryByText('Tool1')).toBeNull();
	});

	it('small tile reveals sub-items on click', async () => {
		const { getByRole, findByText } = render(DashboardTile, { props: smallProps });
		await fireEvent.click(getByRole('button'));
		expect(await findByText('Tool1')).toBeTruthy();
	});

	it('applies grid-area style', () => {
		const { container } = render(DashboardTile, { props: smallProps });
		expect(container.firstChild.style.gridArea).toBe('mytools');
	});
});
