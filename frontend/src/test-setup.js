import '@testing-library/jest-dom';

Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: (query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => false
	})
});

Object.defineProperty(window, 'ResizeObserver', {
	writable: true,
	value: class ResizeObserver {
		observe() {}
		unobserve() {}
		disconnect() {}
	}
});

// Svelte fly/fade transitions use Web Animations API which jsdom lacks
Element.prototype.animate = () => ({
	finished: Promise.resolve(),
	cancel() {},
	pause() {},
	play() {},
	set onfinish(fn) { if (typeof fn === 'function') fn(); }
});
