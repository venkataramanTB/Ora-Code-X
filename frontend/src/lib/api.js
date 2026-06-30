import { goto } from '$app/navigation';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

/**
 * @param {string} url
 * @param {RequestInit} options
 * @param {string | null | undefined} token
 */
function fetchWithToken(url, options, token) {
	return fetch(url, {
		...options,
		headers: {
			...JSON_HEADERS,
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...options.headers,
		},
	});
}

/**
 * fetch wrapper that automatically retries with a fresh Clerk token on 401,
 * and signs the user out + redirects to /sign-in if the retry also fails.
 *
 * @param {string} url
 * @param {RequestInit} options
 * @param {{ session: import('svelte-clerk').ClerkContext['session'], signOut: () => Promise<void> }} auth
 * @returns {Promise<Response>}
 */
export async function apiFetch(url, options = {}, { session, signOut }) {
	const token = await session?.getToken() ?? null;
	let res = await fetchWithToken(url, options, token);

	if (res.status !== 401) return res;

	// Token may have just expired — force a fresh one from Clerk and retry once
	const freshToken = await session?.getToken({ skipCache: true }) ?? null;
	res = await fetchWithToken(url, options, freshToken);

	if (res.status === 401) {
		try { await signOut(); } catch { /* ignore — session may already be gone */ }
		await goto('/sign-in');
		throw new Error('Session expired — signed out');
	}

	return res;
}
