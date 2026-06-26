import { render, fireEvent } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { describe, it, expect, beforeEach } from 'vitest';
import { sidebarOpen } from '$lib/stores/navigation.js';
import Sidebar from './Sidebar.svelte';

beforeEach(() => sidebarOpen.set(false));

describe('Sidebar', () => {
	it('is hidden when sidebarOpen is false', () => {
		const { queryByRole } = render(Sidebar);
		expect(queryByRole('navigation')).toBeNull();
	});

	it('is visible when sidebarOpen is true', async () => {
		sidebarOpen.set(true);
		const { findByRole } = render(Sidebar);
		expect(await findByRole('navigation')).toBeTruthy();
	});

	it('closes when backdrop is clicked', async () => {
		sidebarOpen.set(true);
		const { findByTestId } = render(Sidebar);
		await fireEvent.click(await findByTestId('sidebar-backdrop'));
		expect(get(sidebarOpen)).toBe(false);
	});
});
