# Distinct Theme Personalities — Design Spec
**Date:** 2026-06-30  
**Scope:** Approach C — CSS Variables + Behavioral Overrides + Texture Layers + Clerk Avatar

---

## Problem

All 5 visual styles (neo, minimal, skeu, brutal, maximal) currently share:
- Inter font
- Identical animation curves and speeds
- Same hover interaction (tilt + glow) on all tiles
- Same typography scale, weight, and letter-spacing
- Same spacing density
- No background textures or surface character differences

Switching themes feels like a recolor, not a personality change.

---

## Goal

Each theme must feel physically different to use — not just look different. A user should be able to close their eyes, interact with a tile, open them, and know which theme they're on from the motion alone.

---

## Architecture

Changes are primarily CSS, with minimal Svelte edits:
1. `app.css` — new CSS variable contract + per-theme blocks + texture layers
2. `app.html` — Google Fonts `<link>` preconnect + stylesheet
3. `Topbar.svelte` — Clerk user avatar component
4. `DashboardTile.svelte` — wire new CSS variables into transition and hover styles (minor)
5. No changes to `DashboardGrid.svelte` or stores

### New CSS Variable Contract

Added to `:root` (Neo defaults), overridden per `html[data-style="X"]`:

| Variable | Purpose | Neo default |
|---|---|---|
| `--font-family` | Typeface per theme | Inter |
| `--font-weight-normal` | Body weight | 400 |
| `--font-weight-bold` | Heading/label weight | 700 |
| `--letter-spacing-ui` | UI label tracking | 0.10em |
| `--radius-tile` | Tile corner radius | 20px |
| `--radius-chip` | Chip corner radius | 20px |
| `--radius-card` | Card corner radius | 20px |
| `--transition-speed` | Base transition duration | 220ms |
| `--transition-easing` | Base easing curve | cubic-bezier(0.16,1,0.3,1) |
| `--tile-hover-lift` | translateY on tile hover | -4px |
| `--tile-hover-glow-strength` | Tile glow opacity on hover | 1 |
| `--orb-blur` | Background orb blur radius | 120px |

`html` and `body` use `font-family: var(--font-family)`.  
`.tile-label`, `.chip a`, `.wide-title` etc. use `letter-spacing: var(--letter-spacing-ui)`.  
`.tile:hover` uses `transform: translateY(var(--tile-hover-lift))`.

---

## Per-Theme Personality

### Neo (default — no personality changes)
- **Font:** Inter (already loaded via @fontsource)
- **Weights:** 400/700
- **Tracking:** 0.10em on UI labels
- **Radius:** tile 20px · chip 20px · card 20px
- **Transition:** 220ms · `cubic-bezier(0.16,1,0.3,1)`
- **Hover:** tilt + glow bloom + −4px lift
- **Texture:** none
- **Cursor:** default

---

### Minimal
- **Font:** DM Sans (Google Fonts)
- **Weights:** 400 body · 500 labels (no bold — lightness is identity)
- **Tracking:** 0.04em (barely any — anti-label feel)
- **Radius:** tile 8px · chip 6px · card 10px
- **Transition:** 120ms · `linear`
- **Hover:** NO tilt shadow change · NO glow layer (`--tile-hover-glow-strength: 0`) · only 1px border color shift · `--tile-hover-lift: -2px`
- **Texture:** none — absence is the texture
- **Cursor:** default
- **Extra:** `.tile-glow { display: none }` in minimal — no ambient colour bleed at all

---

### Skeuomorphic
- **Font:** Libre Baskerville (Google Fonts) — warm serif
- **Weights:** 400/700
- **Tracking:** 0.02em
- **Radius:** tile 18px · chip 14px · card 22px
- **Transition:** 380ms · `cubic-bezier(0.4,0,0.2,1)` (slow, weighted)
- **Hover:** tilt runs at normal angle but 380ms easing makes it feel slow and weighted · NO border-glow ring · deeper inset press bevel
- **Texture (dark):** `repeating-conic-gradient` paper grain on tile backgrounds (1% opacity noise pattern)
- **Texture (light):** wood grain already implemented
- **Cursor:** default

---

### Brutalism
- **Font:** Space Mono (Google Fonts) — monospace typewriter
- **Weights:** 700 everywhere
- **Tracking:** 0.18em
- **Text transform:** `text-transform: uppercase` on `.tile-label`, `.wide-title`, `.hero-title`, `.chip a`
- **Radius:** 0 everywhere (already set, enforced on more elements)
- **Transition:** 80ms · `steps(1)` — binary snap, zero easing
- **Hover:** NO tilt · NO glow · translate `(-4px, -4px)` with hard shadow growing from `6px 6px 0` to `10px 10px 0`
- **Texture:** `repeating-linear-gradient` grid overlay on `html[data-style="brutal"] body::before` — 1px lines at 24px intervals, 3% opacity accent colour
- **Cursor:** `crosshair` on `.tile`, `.tile-inner`, interactive elements
- **Extra:** `::selection` bg = `var(--accent-primary)` · color = `var(--bg-base)`

---

### Maximalism
- **Font:** Plus Jakarta Sans (Google Fonts) — expressive, wide weight range
- **Weights:** 800 headings · 300 body
- **Tracking:** 0.06em
- **Radius:** tile 28px · chip 28px (pill) · card 32px
- **Transition:** 340ms · `cubic-bezier(0.34,1.56,0.64,1)` (bouncy overshoot)
- **Hover:** tilt full 6° · `--tile-hover-glow-strength: 1.5` · `--tile-hover-lift: -8px` · `.shine` element gets `@keyframes shimmer` sweep
- **Texture:** animated shimmer gradient sweep on `.tile-glow` — `@keyframes tile-shimmer` translates a highlight stripe across the tile on hover
- **Cursor:** default

---

## Clerk User Avatar (Topbar)

**Where:** `frontend/src/lib/components/Topbar.svelte`  
**When:** User is signed in (use `useUser()` from `svelte-clerk`)

**Behaviour:**
- 32×32px circle, placed between the AppearancePicker trigger and the right edge of the topbar
- Shows `user.imageUrl` if available
- Falls back to initials (`user.firstName[0] + user.lastName[0]`) in a circle with `background: rgba(var(--accent-primary-rgb), 0.18)` and `color: var(--accent-primary)`
- `border-radius` uses `var(--radius-chip)` so it morphs correctly in Brutalism (0px → square avatar)
- Signed-out state: show nothing (Clerk's `<SignInButton>` already handles sign-in flow elsewhere)

---

## Google Fonts Loading

Add to `frontend/src/app.html` `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=Libre+Baskerville:wght@400;700&family=Space+Mono:wght@400;700&family=Plus+Jakarta+Sans:wght@300;400;800&display=swap" rel="stylesheet">
```

`@fontsource/inter` stays for Neo (already bundled, no network request).

---

## Files to Change

| File | Change |
|---|---|
| `frontend/src/app.html` | Add Google Fonts `<link>` tags |
| `frontend/src/app.css` | New CSS variable contract in `:root`; per-style variable overrides; behavioural CSS overrides; texture layers; `::selection` for brutal |
| `frontend/src/lib/components/Topbar.svelte` | Clerk user avatar |
| `frontend/src/lib/components/DashboardTile.svelte` | Wire `--letter-spacing-ui`, `--tile-hover-lift`, `--tile-hover-glow-strength`, `--transition-speed`, `--transition-easing` into inline styles/class transitions |

---

## Out of Scope

- Layout/grid geometry changes per theme (separate feature)
- Backend persistence of theme choice (TODO stubs already in store)
- Changing AppearancePicker mockup thumbnails to reflect new fonts
- Svelte animation (`fly`, `fade`) timing changes per theme
