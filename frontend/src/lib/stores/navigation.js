import { writable } from 'svelte/store';

export const sidebarOpen      = writable(false);
export const activeSection    = writable('');
export const expandedSections = writable(new Set());

/** ID of the nav section to auto-expand when the sidebar next opens. Cleared by NavItem on use. */
export const pendingExpand = writable(/** @type {string|null} */ (null));
