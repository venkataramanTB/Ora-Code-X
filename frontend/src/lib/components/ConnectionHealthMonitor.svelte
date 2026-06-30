<script>
	import { useClerkContext } from 'svelte-clerk';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

	const { session } = useClerkContext();

	/**
	 * @typedef {{ id: string, connection_name: string, instance_url: string, message: string }} FailingConn
	 * @type {{ failing: FailingConn[] } | null}
	 */
	let alert = $state(null);
	let countdown = $state(5);
	/** @type {ReturnType<typeof setInterval> | null} */
	let countdownTimer = null;
	// Non-reactive flags — do not need to trigger re-renders
	let checking = false;
	let checked = false;

	const isAuthRoute = $derived(
		$page.url.pathname.startsWith('/sign-in') ||
		$page.url.pathname.startsWith('/sign-up')
	);

	async function runCheck() {
		if (checking || checked || isAuthRoute) return;
		const token = await session?.getToken();
		if (!token) return;

		checked = true;
		checking = true;

		try {
			const res = await fetch(`${API}/api/connections/test-all`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
				signal: AbortSignal.timeout(60_000),
			});
			if (!res.ok) return;
			const results = await res.json();
			const failing = results.filter(/** @param {any} r */ r => !r.success);
			if (failing.length > 0) {
				alert = { failing };
				startCountdown();
			}
		} catch {
			// Backend unavailable or user has no connections — silently skip
		} finally {
			checking = false;
		}
	}

	function startCountdown() {
		countdown = 5;
		if (countdownTimer) clearInterval(countdownTimer);
		countdownTimer = setInterval(() => {
			countdown -= 1;
			if (countdown <= 0) {
				clearInterval(countdownTimer);
				countdownTimer = null;
				goNow();
			}
		}, 1000);
	}

	function goNow() {
		if (!alert?.failing?.length) return;
		const first = alert.failing[0];
		alert = null;
		if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
		goto(`/admin/connections/saas?edit=${first.id}`);
	}

	function dismiss() {
		if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
		alert = null;
	}

	// Fire whenever the session ID appears (login) or on page load with active session
	$effect(() => {
		const sessionId = session?.id;
		if (sessionId && !isAuthRoute) {
			runCheck();
		}
	});
</script>

{#if alert}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="hm-overlay"
		role="alertdialog"
		aria-modal="true"
		aria-labelledby="hm-title"
		aria-describedby="hm-desc"
	>
		<div class="hm-card">
			<!-- Ambient glow orbs -->
			<span class="hm-orb hm-orb-amber" aria-hidden="true"></span>
			<span class="hm-orb hm-orb-red" aria-hidden="true"></span>

			<!-- Header -->
			<div class="hm-header">
				<div class="hm-icon-wrap" aria-hidden="true">
					<svg viewBox="0 0 24 24" width="20" height="20" fill="none">
						<path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
							stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</div>
				<div>
					<h2 class="hm-title" id="hm-title">
						Connection {alert.failing.length === 1 ? 'Issue' : 'Issues'} Detected
					</h2>
					<p class="hm-subtitle" id="hm-desc">
						{alert.failing.length === 1
							? 'One connection failed the startup health check'
							: `${alert.failing.length} connections failed the startup health check`}
					</p>
				</div>
			</div>

			<!-- Gradient divider -->
			<div class="hm-divider"></div>

			<!-- Failing connection cards -->
			<div class="hm-list">
				{#each alert.failing as f (f.id)}
					<div class="hm-item">
						<div class="hm-item-icon" aria-hidden="true">
							<svg viewBox="0 0 16 16" width="13" height="13" fill="none">
								<path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
							</svg>
						</div>
						<div class="hm-item-body">
							<span class="hm-item-name">{f.connection_name}</span>
							<span class="hm-item-url">{f.instance_url}</span>
							<span class="hm-item-err">{f.message}</span>
						</div>
					</div>
				{/each}
			</div>

			<!-- Countdown bar -->
			<div class="hm-countdown">
				<div class="hm-bar-track" role="progressbar" aria-valuenow={countdown} aria-valuemin={0} aria-valuemax={5}>
					<div class="hm-bar-fill"></div>
				</div>
				<span class="hm-countdown-text">
					Navigating to connections in <strong>{countdown}s</strong>…
				</span>
			</div>

			<!-- Actions -->
			<div class="hm-actions">
				<button class="hm-btn-dismiss" onclick={dismiss}>Dismiss</button>
				<button class="hm-btn-go" onclick={goNow}>
					Go to Connections Now
					<svg viewBox="0 0 20 20" fill="none" width="14" height="14" aria-hidden="true">
						<path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* ── Overlay ─────────────────────────────────────────────────────────── */
	.hm-overlay {
		position: fixed;
		inset: 0;
		z-index: 500;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
		background: rgba(0, 0, 0, 0.72);
		backdrop-filter: blur(18px) saturate(0.55);
		-webkit-backdrop-filter: blur(18px) saturate(0.55);
		animation: hm-overlay-in 0.2s ease-out;
	}

	@keyframes hm-overlay-in {
		from { opacity: 0; }
		to   { opacity: 1; }
	}

	/* ── Card ────────────────────────────────────────────────────────────── */
	.hm-card {
		position: relative;
		width: 100%;
		max-width: 520px;
		background: var(--bg-base);
		border-radius: 22px;
		border: 1px solid rgba(255, 140, 0, 0.22);
		box-shadow:
			0 0 0 1px rgba(255, 255, 255, 0.04),
			0 28px 90px rgba(0, 0, 0, 0.65),
			0 0 70px rgba(255, 120, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
		overflow: hidden;
		animation: hm-card-in 0.3s cubic-bezier(0.34, 1.3, 0.64, 1);
	}

	@keyframes hm-card-in {
		from { opacity: 0; transform: scale(0.91) translateY(22px); }
		to   { opacity: 1; transform: scale(1)    translateY(0); }
	}

	/* ── Ambient orbs ────────────────────────────────────────────────────── */
	.hm-orb {
		position: absolute;
		border-radius: 50%;
		pointer-events: none;
		filter: blur(52px);
		opacity: 0.16;
	}

	.hm-orb-amber {
		width: 230px; height: 230px;
		background: #ff8c00;
		top: -70px; right: -55px;
	}

	.hm-orb-red {
		width: 170px; height: 170px;
		background: #ff4d6d;
		bottom: -55px; left: -35px;
	}

	/* ── Header ──────────────────────────────────────────────────────────── */
	.hm-header {
		display: flex;
		align-items: flex-start;
		gap: 14px;
		padding: 26px 28px 20px;
		position: relative;
		z-index: 1;
	}

	.hm-icon-wrap {
		flex-shrink: 0;
		width: 44px; height: 44px;
		display: flex; align-items: center; justify-content: center;
		border-radius: 13px;
		background: rgba(255, 140, 0, 0.12);
		border: 1px solid rgba(255, 140, 0, 0.3);
		color: #ffaa00;
		box-shadow: 0 0 22px rgba(255, 140, 0, 0.18);
		margin-top: 2px;
	}

	.hm-title {
		font-size: 17px;
		font-weight: 700;
		color: var(--text-accent);
		margin: 0 0 5px;
		letter-spacing: -0.02em;
	}

	.hm-subtitle {
		font-size: 12.5px;
		color: var(--text-muted);
		margin: 0;
		line-height: 1.5;
	}

	/* ── Divider ─────────────────────────────────────────────────────────── */
	.hm-divider {
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent,
			rgba(255, 140, 0, 0.18) 20%,
			rgba(255, 140, 0, 0.32) 50%,
			rgba(255, 140, 0, 0.18) 80%,
			transparent
		);
		margin: 0 28px;
		position: relative;
		z-index: 1;
	}

	/* ── Failing list ────────────────────────────────────────────────────── */
	.hm-list {
		padding: 18px 28px 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
		position: relative;
		z-index: 1;
		max-height: 280px;
		overflow-y: auto;
	}

	.hm-item {
		display: flex;
		align-items: flex-start;
		gap: 11px;
		padding: 13px 14px;
		border-radius: 12px;
		background: rgba(255, 77, 109, 0.07);
		border: 1px solid rgba(255, 77, 109, 0.2);
	}

	.hm-item-icon {
		flex-shrink: 0;
		width: 26px; height: 26px;
		display: flex; align-items: center; justify-content: center;
		border-radius: 50%;
		background: rgba(255, 77, 109, 0.18);
		color: #ff4d6d;
		margin-top: 1px;
	}

	.hm-item-body {
		display: flex;
		flex-direction: column;
		gap: 3px;
		min-width: 0;
	}

	.hm-item-name {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-accent);
	}

	.hm-item-url {
		font-size: 11.5px;
		color: var(--text-muted);
		opacity: 0.65;
		font-family: monospace;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.hm-item-err {
		font-size: 12px;
		color: #ff7a7a;
		line-height: 1.45;
		margin-top: 3px;
	}

	/* ── Countdown ───────────────────────────────────────────────────────── */
	.hm-countdown {
		padding: 18px 28px 0;
		display: flex;
		flex-direction: column;
		gap: 9px;
		position: relative;
		z-index: 1;
	}

	.hm-bar-track {
		width: 100%;
		height: 3px;
		background: rgba(255, 255, 255, 0.07);
		border-radius: 2px;
		overflow: hidden;
	}

	.hm-bar-fill {
		height: 100%;
		background: linear-gradient(90deg, #ff4d6d, #ffaa00);
		border-radius: 2px;
		animation: hm-bar-shrink 5s linear forwards;
	}

	@keyframes hm-bar-shrink {
		from { width: 100%; }
		to   { width: 0%; }
	}

	.hm-countdown-text {
		font-size: 12px;
		color: var(--text-muted);
		opacity: 0.7;
	}

	.hm-countdown-text strong {
		color: #ffaa00;
		font-weight: 600;
	}

	/* ── Actions ─────────────────────────────────────────────────────────── */
	.hm-actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 10px;
		padding: 16px 28px 24px;
		position: relative;
		z-index: 1;
	}

	.hm-btn-dismiss {
		padding: 9px 18px;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(255, 255, 255, 0.04);
		color: var(--text-muted);
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: background .14s, color .14s;
	}

	.hm-btn-dismiss:hover {
		background: rgba(255, 255, 255, 0.09);
		color: var(--text-primary);
	}

	.hm-btn-go {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		padding: 9px 18px;
		border-radius: 10px;
		border: 1px solid rgba(255, 140, 0, 0.38);
		background: rgba(255, 140, 0, 0.12);
		color: #ffaa00;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: background .14s, border-color .14s, box-shadow .14s;
	}

	.hm-btn-go:hover {
		background: rgba(255, 140, 0, 0.22);
		border-color: rgba(255, 140, 0, 0.58);
		box-shadow: 0 0 20px rgba(255, 140, 0, 0.22);
	}

	/* ── Mobile ──────────────────────────────────────────────────────────── */
	@media (max-width: 600px) {
		.hm-card { border-radius: 18px; }
		.hm-header, .hm-actions, .hm-countdown { padding-left: 20px; padding-right: 20px; }
		.hm-divider { margin: 0 20px; }
		.hm-list { padding: 14px 20px 0; }
		.hm-actions { flex-direction: column; }
		.hm-btn-go, .hm-btn-dismiss { width: 100%; justify-content: center; }
	}
</style>
