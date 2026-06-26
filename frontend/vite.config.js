import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
	plugins: [
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({ fallback: 'index.html' })
		})
	],
	resolve: {
		conditions: mode === 'test' ? ['browser'] : []
	},
	test: {
		include: ['src/**/*.{test,spec}.js'],
		environment: 'jsdom',
		globals: true,
		setupFiles: ['src/test-setup.js']
	}
}));
