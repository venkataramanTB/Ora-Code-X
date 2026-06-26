import { writable, derived } from 'svelte/store';
import {
	COLOR_KEY, STYLE_KEY,
	DEFAULT_COLOR_ID, DEFAULT_STYLE_ID,
	COLOR_MODES, VISUAL_STYLES, CLERK_VARS,
} from '$lib/data/styles.js';

export const scrolled = writable(false);

export const currentColorId = writable(DEFAULT_COLOR_ID);
export const currentStyleId = writable(DEFAULT_STYLE_ID);

export const currentColor = derived(currentColorId, $id => COLOR_MODES[$id] ?? COLOR_MODES[DEFAULT_COLOR_ID]);
export const currentStyle = derived(currentStyleId, $id => VISUAL_STYLES[$id] ?? VISUAL_STYLES[DEFAULT_STYLE_ID]);

// Clerk appearance derived from active color mode
export const clerkVars = derived(currentColorId, $id => CLERK_VARS[$id] ?? CLERK_VARS[DEFAULT_COLOR_ID]);

export function setColorMode(id) {
	if (!COLOR_MODES[id]) return;
	currentColorId.set(id);
	try { localStorage.setItem(COLOR_KEY, id); } catch {}
	if (typeof document !== 'undefined') document.documentElement.setAttribute('data-color', id);
	// TODO(backend): POST /api/user/preferences { colorMode: id }
}

export function setVisualStyle(id) {
	if (!VISUAL_STYLES[id]) return;
	currentStyleId.set(id);
	try { localStorage.setItem(STYLE_KEY, id); } catch {}
	if (typeof document !== 'undefined') document.documentElement.setAttribute('data-style', id);
	// TODO(backend): POST /api/user/preferences { visualStyle: id }
}

export function initTheme() {
	let colorId = DEFAULT_COLOR_ID;
	let styleId = DEFAULT_STYLE_ID;
	try {
		const storedColor = localStorage.getItem(COLOR_KEY);
		const storedStyle = localStorage.getItem(STYLE_KEY);
		if (storedColor && COLOR_MODES[storedColor]) colorId = storedColor;
		if (storedStyle && VISUAL_STYLES[storedStyle]) styleId = storedStyle;
	} catch {}
	currentColorId.set(colorId);
	currentStyleId.set(styleId);
	if (typeof document !== 'undefined') {
		document.documentElement.setAttribute('data-color', colorId);
		document.documentElement.setAttribute('data-style', styleId);
	}
}
