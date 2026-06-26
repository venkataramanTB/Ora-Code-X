# OraCodeX Studio — Neomorphic Spatial UI Redesign
**Date:** 2026-06-26  
**Stack:** SvelteKit (Svelte 5)  
**Status:** Approved

---

## 1. Overview

Redesign OraCodeX Studio's layout from a classic left-sidebar pattern into a full spatial UI with physics-based motion. Navigation moves from a vertical sidebar into a horizontal topbar. On scroll, a hamburger icon appears and clicking it slides in a sidebar panel. The dashboard becomes a spatial launchpad with large 3D-tiltable tiles.

Visual language: **Neomorphism + Spatial UI**. All surfaces are solid dark neomorphic material — extruded from the background using dual light/dark shadows. Depth is communicated through shadow intensity (elevation) and 3D perspective transforms, not transparency. The critical innovation is **dynamic shadow tilt**: as cards tilt in 3D space, their neomorphic shadows shift in real-time to simulate a fixed overhead light source, creating a convincing physical tactility.

Dark mode is the default and only mode.

---

## 2. Navigation Structure

### Nav Items (preserved from original)
| Item | Sub-items | Accent Color |
|---|---|---|
| DeliveryX | Oracle Cloud ConverXion, IntegraXion, Cross ValidaXion, DataXMining, Cloud OperaXions | `#00d4ff` cyan |
| My Tools | (expandable) | `#f5a623` gold |
| Work Space | — | `#ff4d6d` pink |
| Monitoring | (expandable) | `#00e676` green |
| Dashboard | — | `#4fc3f7` sky blue |
| Administration | (expandable) | `#b39ddb` purple |

### Tagline Keywords (colored)
`Extract` #ff4d6d · `Convert` #00d4ff · `Integrate` #00e676 · `Operate` #ff9800 · `Validate` #b39ddb · `Deliver` #4fc3f7

---

## 3. Layout Behavior

### Default State (not scrolled)
- Topbar floats 8px from the top and side edges with `border-radius: 20px` — it hovers above the page, not flush
- Topbar height: 64px, neomorphic convex surface (raised from the background)
- Topbar contains: Logo (left) · Nav items (center, horizontal) · Search + User avatar (right)
- Secondary tagline bar below topbar (36px): scrolling marquee of the tagline text with colored keywords
- No sidebar visible

### Scrolled State (past 80px)
- Topbar compresses to 48px with spring animation (snappy preset)
- Tagline bar collapses height 36px → 0px with spring
- Hamburger icon `☰` materializes left of logo: scale spring `0.6 → 1.0` + opacity fade
- Horizontal nav items fade out of topbar
- Topbar retains: Hamburger + Logo + Search + User

### Hamburger Click → Sidebar Open
- Sidebar panel (320px wide) slides in from left: `translateX(-100%) → 0` with bouncy spring (slight overshoot)
- Sidebar is a neomorphic convex panel elevated above the page
- Backdrop: `background: rgba(0, 0, 0, 0.5)`, no blur — neomorphic design keeps surfaces opaque
- NavItems stagger in with 40ms delay per item (top to bottom)
- Close triggers: clicking backdrop, clicking ✕ button, pressing Escape

### NavItem Expand (sub-items)
- Chevron rotates 0° → 90° with spring
- Sub-item list height springs from 0 → measured height (via ResizeObserver)
- Sub-items are pill-shaped neomorphic pressed (concave) chips with their section accent color as text/border

---

## 4. Visual Design System

### Neomorphism Foundation

Neomorphism requires the background and all surface elements to share the **same base hue**. The illusion of depth comes entirely from dual shadows — never from transparency or color change.

**Critical rule:** Every neomorphic element uses exactly `--bg-base` as its background color. Depth is expressed through shadow only.

```css
/* Light source: top-left at ~45° */
--shadow-light: rgba(255, 255, 255, 0.045);  /* lighter highlight shadow */
--shadow-dark:  rgba(0, 0, 0, 0.55);         /* deeper dark shadow */
```

### Neomorphic Surface States

```css
/* Convex (raised) — default elements, topbar, sidebar, tiles */
.neo-convex {
  box-shadow:
    -8px -8px 16px var(--shadow-light),
     8px  8px 16px var(--shadow-dark);
}

/* Concave (pressed) — active/clicked state, pressed buttons, input fields */
.neo-concave {
  box-shadow:
    inset -4px -4px 8px var(--shadow-light),
    inset  4px  4px 8px var(--shadow-dark);
}

/* Flat — secondary surfaces, neutral state */
.neo-flat {
  box-shadow:
    -4px -4px 8px var(--shadow-light),
     4px  4px 8px var(--shadow-dark);
}
```

### Elevation System (spatial depth via shadow scale)

| Elevation | Shadow spread | Use |
|---|---|---|
| `elev-0` | flat, no shadow | Background items |
| `elev-1` | 4px / 4px | Sub-item chips, small controls |
| `elev-2` | 8px / 8px | Dashboard tiles, nav items |
| `elev-3` | 16px / 16px | Topbar, sidebar panel |
| `elev-4` | 24px / 24px | Active/hovered tiles, modals |

### Color Tokens

```css
--bg-base:         #13171f;   /* dark navy-gray — ALL surfaces use this exact color */
--accent-cyan:     #00d4ff;   /* primary accent — icons, active states, glows */
--accent-gold:     #f5a623;   /* secondary accent — logo X, hover accents */
--text-primary:    #c8d0e0;   /* main text — slightly desaturated for neo look */
--text-muted:      #6b7a99;   /* secondary labels */
--text-accent:     #e8edf5;   /* headings, active labels */
--accent-glow-cyan: rgba(0, 212, 255, 0.12);  /* glow halo on active tiles */
--accent-glow-gold: rgba(245, 166, 35, 0.12); /* glow halo on hover */
```

### Background

- Pure flat `--bg-base` (#13171f) — no circuit grid, no texture
- 3 very subtle radial-gradient orbs at `z-index: 0`, opacity 0.06 — barely visible color warmth in corners (cyan top-right, gold bottom-left, indigo top-left)
- Orbs drift slowly via CSS keyframes (90s cycle), `use:parallax` at `depth: 0.015`
- The background itself never draws attention — neomorphic surfaces define the visual hierarchy

### Typography

- Font: `Inter` (loaded via `@fontsource/inter`) — clean, geometric, pairs well with neo design
- Logo: Bold 20px, X characters in `--accent-cyan` with subtle `text-shadow: 0 0 12px var(--accent-cyan)`
- Nav labels: 14px medium, `--text-primary`
- Dashboard tile labels: 13px medium, `--text-muted`, uppercase tracking `0.08em`
- Tagline: 12px, mixed colored spans

### Dynamic Shadow Tilt (key neomorphic + spatial technique)

When `use:tilt` rotates a neomorphic card, the shadow positions must shift to maintain the illusion of a fixed overhead light source. The `use:tilt` action exposes CSS custom properties on the element:

```css
--tilt-x: <degrees>;   /* current rotateX */
--tilt-y: <degrees>;   /* current rotateY */
```

The element's shadow is expressed as a CSS `calc()` that adjusts shadow offset based on tilt:

```css
.neo-tiltable {
  box-shadow:
    calc(-8px + var(--tilt-y, 0) * 1.2px) calc(-8px + var(--tilt-x, 0) * 1.2px) 20px var(--shadow-light),
    calc( 8px + var(--tilt-y, 0) * 1.2px) calc( 8px + var(--tilt-x, 0) * 1.2px) 20px var(--shadow-dark);
}
```

This means as the card tilts right, the light shadow shifts right and the dark shadow follows — the card feels physically real.

---

## 5. Dashboard — Neomorphic Bento Grid Launchpad

### Bento Layout

The dashboard uses CSS `grid-template-areas` for a mosaic layout. Six nav sections map to tiles of varied sizes — one hero, two medium, three small — creating visual hierarchy through scale.

```
Desktop (≥1024px):
┌─────────────────────────┬──────────┬──────────┐
│                         │          │          │
│       DeliveryX         │ My Tools │WorkSpace │
│       (hero, 2×2)       │  (1×1)   │  (1×1)   │
│                         │          │          │
│                         ├──────────┴──────────┤
│                         │                     │
│                         │    Monitoring       │
│                         │     (2×1 wide)      │
├────────────┬────────────┴─────────────────────┤
│            │                                  │
│ Dashboard  │       Administration             │
│   (1×1)    │         (2×1 wide)               │
│            │                                  │
└────────────┴──────────────────────────────────┘
```

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(3, minmax(160px, auto));
  gap: 20px;
  grid-template-areas:
    "delivery  delivery  mytools   workspace"
    "delivery  delivery  monitor   monitor"
    "dashboard admin     admin     admin";
}
```

**Tablet (768px–1023px):** 2-column grid, DeliveryX hero becomes 2×1, others stack as 1×1.

**Mobile (<768px):** Single column, all tiles full-width, stacked vertically.

### Tile Size Vocabulary
| Tile | Grid area | Visual weight |
|---|---|---|
| DeliveryX | 2×2 (hero) | `elev-4`, `border-radius: 24px` |
| Monitoring | 2×1 wide | `elev-3`, `border-radius: 20px` |
| Administration | 3×1 wide | `elev-3`, `border-radius: 20px` |
| My Tools | 1×1 | `elev-2`, `border-radius: 16px` |
| Work Space | 1×1 | `elev-2`, `border-radius: 16px` |
| Dashboard | 1×1 | `elev-2`, `border-radius: 16px` |

### Tile Anatomy

**Hero tile (DeliveryX, 2×2):**
```
┌─────────────────────────────────────┐
│  [icon 72px]                        │
│  [accent glow 80px radius]          │
│                                     │
│  DELIVERYX                          │  ← large label, text-accent
│  The Intelligent Cloud Delivery     │  ← subtitle, text-muted, 12px
│                                     │
│  [sub-item chips — always visible]  │  ← inline expanded by default
└─────────────────────────────────────┘
```

**Wide tile (Monitoring, Administration):**
```
┌──────────────────────────────────────────┐
│  [icon 52px]  MONITORING                 │  ← icon + label side by side
│               [sub-item chips on expand] │
└──────────────────────────────────────────┘
```

**Small tile (My Tools, Work Space, Dashboard):**
```
┌───────────────┐
│  [icon 48px]  │
│  [glow]       │
│  MY TOOLS     │
└───────────────┘
```

### Tile Common Specs
- All surfaces: `--bg-base` + `neo-convex` at their elevation level
- Icon: colored per section accent, `filter: drop-shadow(0 0 8px <accent>)`
- Glow halo: radial gradient, `var(--accent-glow-<color>)`, radius scales with tile size
- No borders — depth from shadow only
- Sub-items: `neo-concave elev-1` pill chips

### Tile Interactions
- **Hover:** `use:tilt` (±6° hero, ±8° small tiles), dynamic shadow tilt, elevation +1, icon scales (snappy spring), glow expands
- **Click (small/wide tiles):** Brief concave press → expand sub-items as pill chips with 30ms stagger
- **Hero tile (DeliveryX):** Sub-items always visible, clicking a chip navigates directly
- **Active tile:** `outline: 1px solid <accent>` inset ring + one elevation higher

---

## 6. Motion System

### Spring Presets (`src/lib/motion/springs.js`)
```js
export const snappy  = { stiffness: 0.3, damping: 0.8 }  // UI controls, buttons
export const bouncy  = { stiffness: 0.2, damping: 0.6 }  // tiles, sidebar panel
export const floaty  = { stiffness: 0.08, damping: 0.5 } // orbs, background layers
```

### Svelte Actions (`src/lib/actions/`)
| Action | File | Behavior |
|---|---|---|
| `use:tilt` | `tilt.js` | 3D perspective tilt on mousemove; updates `--tilt-x` / `--tilt-y` CSS vars for dynamic shadow; springs back on mouseleave |
| `use:parallax` | `parallax.js` | Translates element based on global mouse position × `depth` prop (0.0–1.0) |
| `use:magnetic` | `magnetic.js` | Softly pulls element toward cursor within 60px radius at 30% strength; springs back on mouseleave |

### Global Mouse Store (`src/lib/stores/mouse.js`)
- Tracks `mouseX` and `mouseY` as normalized values (-1 to 1) relative to viewport center
- Single `mousemove` listener initialized in `+layout.svelte`
- Consumed by `use:parallax` and `use:tilt` actions via store subscription inside the action

### Page Transitions
- Svelte `crossfade` in `+layout.svelte`
- Outgoing page: scale 1.0 → 0.97 + opacity 1 → 0 (100ms)
- Incoming page: scale 1.03 → 1.0 + opacity 0 → 1 (150ms)
- No blur — neomorphic aesthetic avoids blur effects

### Reduced Motion
All spring values and keyframe animations check `@media (prefers-reduced-motion: reduce)` — switches to instant (0ms) transitions, springs become tweened with 0 duration.

---

## 7. Component Architecture

### File Structure
```
src/
├── lib/
│   ├── stores/
│   │   ├── navigation.js     ← sidebarOpen, activeSection, expandedSections (Set)
│   │   ├── theme.js          ← scrolled (bool) — dark mode always on, no toggle needed
│   │   └── mouse.js          ← mouseX, mouseY (normalized -1 to 1)
│   ├── actions/
│   │   ├── tilt.js           ← use:tilt (updates --tilt-x/--tilt-y CSS vars + rotates element)
│   │   ├── parallax.js       ← use:parallax={depth}
│   │   └── magnetic.js       ← use:magnetic
│   ├── motion/
│   │   └── springs.js        ← snappy / bouncy / floaty constants
│   └── components/
│       ├── Topbar.svelte
│       ├── Sidebar.svelte
│       ├── NavItem.svelte
│       ├── DashboardGrid.svelte
│       ├── DashboardTile.svelte
│       ├── OrbBackground.svelte
│       └── NeoPanel.svelte       ← replaces GlassPanel — neomorphic surface wrapper
├── routes/
│   ├── +layout.svelte        ← mouse store init, scroll detection, OrbBackground + Topbar + Sidebar
│   └── +page.svelte          ← dashboard (DashboardGrid)
└── app.css                   ← CSS tokens, neo shadow utilities, reset, font import
```

### Component Responsibilities

**`+layout.svelte`**
- Initializes global `mousemove` → mouse store
- IntersectionObserver on an 80px sentinel div → writes `$scrolled`
- Renders: `OrbBackground` + `Topbar` + `Sidebar` + `{@render children()}`

**`Topbar.svelte`**
- Reads `$scrolled`, `$sidebarOpen`
- `neo-convex elev-3`, floats with `margin: 8px 8px 0`
- Conditionally shows hamburger (scrolled) vs. horizontal nav items (not scrolled)
- Spring-animates height between 64px and 48px
- Tagline marquee bar beneath it (springs to height 0 on scroll)

**`Sidebar.svelte`**
- Reads `$sidebarOpen`
- Enters with Svelte `fly` transition (x: -320) + bouncy spring timing
- `neo-convex elev-3`, full height, 320px wide
- Renders staggered `NavItem` list
- Opaque dark backdrop (no blur)

**`NavItem.svelte`**
- Props: `icon`, `label`, `accent`, `subItems[]`, `expandable`
- `use:magnetic` on the label text
- Expanded state drives sub-item height spring via ResizeObserver
- Sub-items: `neo-concave elev-1` pill chips

**`DashboardGrid.svelte`**
- CSS `grid-template-areas` bento layout (4 columns × 3 rows desktop, 2-col tablet, 1-col mobile)
- gap: 20px
- Renders 6 `DashboardTile` components with `size` prop (`hero` | `wide` | `small`)

**`DashboardTile.svelte`**
- Props: `icon`, `label`, `accent`, `subItems[]`, `size` (`hero` | `wide` | `small`), `gridArea`
- `size` drives icon px, glow radius, border-radius, elevation, and whether sub-items are always-visible (hero) or click-to-expand (wide/small)
- `use:tilt` — tilt angle ±6° hero, ±8° wide/small; updates `--tilt-x`/`--tilt-y` for dynamic neo shadow
- `expanded` $state rune drives sub-item chip reveal with 30ms stagger
- Press animation: brief `neo-concave` class swap on click (wide/small only)

**`OrbBackground.svelte`**
- Fixed full-viewport `z-index: 0`, pointer-events none
- 3 absolutely-positioned divs with radial gradient + `use:parallax`
- Opacity 0.06 — decorative warmth only

**`NeoPanel.svelte`**
- Reusable neomorphic surface wrapper
- Props: `elevation` (0–4), `state` (`convex` | `concave` | `flat`), `radius` (px, default 20)
- Applies correct shadow class + border-radius + `--bg-base` background

---

## 8. SvelteKit Configuration

- SvelteKit with static adapter (`@sveltejs/adapter-static`) — pure UI shell, no server routes
- **Svelte 5** — runes syntax throughout: `$props()`, `$state()`, `$derived()`; `{@render children()}` in layout; `writable()` stores for cross-component state only
- `@fontsource/inter` for Inter font (self-hosted, no Google Fonts dependency)
- No CSS framework — custom CSS with CSS custom properties
- No JS animation library — Svelte `spring()` and `tweened()` from `svelte/motion`

---

## 9. Out of Scope

- Backend API integration
- Authentication / real user management
- Actual content for sub-pages (IntegraXion, DataXMining, etc.)
- Light mode (dark mode only per spec)
- Mobile-specific nav patterns beyond responsive grid
