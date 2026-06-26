import { writable } from 'svelte/store';

export const sidebarOpen = writable(false);
export const activeSection = writable('');
export const expandedSections = writable(new Set());
