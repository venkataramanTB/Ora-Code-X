import { withClerkHandler } from 'svelte-clerk/server';
import { sequence } from '@sveltejs/kit/hooks';

const INTERNAL_API = process.env.INTERNAL_API_URL ?? 'http://127.0.0.1:8001';

const SKIP_HEADERS = new Set(['host', 'connection', 'origin', 'transfer-encoding']);

/** Proxy /api/* to the internal FastAPI process. */
const apiProxy = async ({ event, resolve }) => {
	if (!event.url.pathname.startsWith('/api/')) return resolve(event);

	const target = `${INTERNAL_API}${event.url.pathname}${event.url.search}`;

	const headers = Object.fromEntries(
		[...event.request.headers.entries()].filter(([k]) => !SKIP_HEADERS.has(k.toLowerCase())),
	);

	const hasBody = !['GET', 'HEAD'].includes(event.request.method);

	const upstream = await fetch(target, {
		method: event.request.method,
		headers,
		...(hasBody ? { body: await event.request.arrayBuffer() } : {}),
	});

	const resHeaders = new Headers(upstream.headers);
	resHeaders.delete('transfer-encoding');
	resHeaders.delete('connection');

	return new Response(upstream.body, { status: upstream.status, headers: resHeaders });
};

export const handle = sequence(apiProxy, withClerkHandler());
