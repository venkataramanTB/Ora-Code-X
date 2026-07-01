import { goto } from '$app/navigation';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

/**
 * Multipart file upload — does NOT set Content-Type so the browser supplies
 * the correct multipart boundary automatically.
 *
 * @param {string} url
 * @param {FormData} formData
 * @param {{ session: import('svelte-clerk').ClerkContext['session'], signOut: () => Promise<void> }} auth
 * @returns {Promise<Response>}
 */
export async function apiUpload(url, formData, { session, signOut }) {
	const getHeaders = async (skipCache = false) => {
		const token = await session?.getToken(skipCache ? { skipCache: true } : undefined) ?? null;
		return token ? { Authorization: `Bearer ${token}` } : {};
	};

	let res = await fetch(url, { method: 'POST', headers: await getHeaders(), body: formData });
	if (res.status !== 401) return res;

	res = await fetch(url, { method: 'POST', headers: await getHeaders(true), body: formData });
	if (res.status === 401) {
		try { await signOut(); } catch { /* ignore */ }
		await goto('/sign-in');
		throw new Error('Session expired — signed out');
	}
	return res;
}

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
