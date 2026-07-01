import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import SectionHero from './SectionHero.svelte';

const tagline = {
	prefix: '',
	title: 'DeliveryX',
	description: 'A unified suite from Mythics of Oracle Cloud delivery accelerators engineered to simplify implementation, migration, conversion, and integration.'
};

const nodeWithChildren = {
	id: 'delivery',
	label: 'DeliveryX',
	href: '/delivery',
	iconName: 'Rocket',
	accent: '#00d4ff',
	children: [
		{
			id: 'conversion-group', label: 'Smart Genesis ConveX', iconName: 'RefreshCw', accent: '#00d4ff',
			children: [{ id: 'conversion', label: 'Smart Genesis ConveX', href: '/delivery/conversion', iconName: 'RefreshCw', children: [] }]
		},
		{ id: 'integration', label: 'IntegraXion', href: '/delivery/integration', iconName: 'GitMerge', accent: '#00d4ff', children: [] }
	]
};

const nodeWithoutChildren = {
	id: 'conversion',
	label: 'Smart Genesis ConveX',
	href: '/delivery/conversion',
	iconName: 'RefreshCw',
	accent: '#00d4ff',
	children: []
};

describe('SectionHero', () => {
	it('renders the exact description text', () => {
		const { getByText } = render(SectionHero, { props: { tagline, node: nodeWithChildren } });
		expect(getByText(tagline.description)).toBeTruthy();
	});

	it('renders a card grid linking directly to a child that has its own href', () => {
		const { getByRole } = render(SectionHero, { props: { tagline, node: nodeWithChildren } });
		expect(getByRole('link', { name: /IntegraXion/ }).getAttribute('href')).toBe('/delivery/integration');
	});

	it('resolves a card link to the first descendant href when a child has none of its own', () => {
		const { getByRole } = render(SectionHero, { props: { tagline, node: nodeWithChildren } });
		expect(getByRole('link', { name: /Smart Genesis ConveX/ }).getAttribute('href')).toBe('/delivery/conversion');
	});

	it('renders no card grid when the node has no children', () => {
		const { queryAllByRole } = render(SectionHero, { props: { tagline, node: nodeWithoutChildren } });
		expect(queryAllByRole('link')).toHaveLength(0);
	});
});
