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
