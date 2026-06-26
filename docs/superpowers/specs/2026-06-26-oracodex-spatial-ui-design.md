# OraCodeX Studio — Spatial UI Redesign
**Date:** 2026-06-26  
**Stack:** SvelteKit  
**Status:** Approved

---

## 1. Overview

Redesign OraCodeX Studio's layout from a classic left-sidebar pattern into a full spatial UI with physics-based motion. Navigation moves from a vertical sidebar into a horizontal topbar. On scroll, a hamburger icon appears and clicking it slides in a sidebar panel. The dashboard becomes a spatial launchpad with large 3D-tiltable tiles. Dark mode is the default and only mode. The visual language blends Glassmorphism and Oracle Futurist aesthetics.

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
- Topbar floats 8px from the top edge with `border-radius: 16px` — it hovers, not flush
- Topbar height: 64px
- Topbar contains: Logo (left) · Nav items (center, horizontal) · Search + User avatar + Dark mode toggle (right)
- Secondary tagline bar below topbar (36px): scrolling marquee of the tagline text with colored keywords
- No sidebar visible

### Scrolled State (past 80px)
- Topbar compresses to 48px with spring animation
- Tagline bar collapses height 36px → 0px with spring
- Hamburger icon `☰` materializes left of logo: scale spring `0.6 → 1.0` + opacity fade
- Horizontal nav items fade out of topbar
- Topbar retains: Hamburger + Logo + Search + User

### Hamburger Click → Sidebar Open
- Sidebar panel (320px wide) slides in from left: `translateX(-100%) → 0` with bouncy spring (slight overshoot)
- Backdrop appears behind sidebar: `backdrop-filter: blur(8px)`, `background: rgba(0,0,0,0.4)`
- NavItems stagger in with 40ms delay per item (top to bottom)
- Close triggers: clicking backdrop, clicking ✕ button, pressing Escape

### NavItem Expand (sub-items)
- Chevron rotates 0° → 90° with spring
- Sub-item list height springs from 0 → measured height (via ResizeObserver)
- Sub-items are pill-shaped chips with their section accent color

---

## 4. Visual Design System

### Color Tokens
```css
--bg-base:         #060b18;   /* near-black navy */
--bg-surface:      #0a1022;   /* slightly lighter for cards */
--accent-cyan:     #00d4ff;   /* primary accent */
--accent-gold:     #f5a623;   /* secondary accent, logo X, hovers */
--accent-glow:     rgba(0, 212, 255, 0.15);
--text-primary:    #e8edf5;
--text-muted:      #6b7a99;
--border-subtle:   rgba(255, 255, 255, 0.08);
--border-active:   rgba(0, 212, 255, 0.4);
```

### Background Layers
- **Layer 0 — Orbs:** 3 large radial-gradient spheres (cyan, gold, indigo) positioned off-center, slowly drifting via CSS keyframes (60s cycle). Parallax offset at `depth: 0.02`.
- **Layer 1 — Circuit grid:** SVG circuit-board pattern at 4% opacity over `--bg-base`. Parallax at `depth: 0.01`.
- **Layer 2 — Page content:** Dashboard tiles, main content area.
- **Layer 3 — Topbar:** Floating, `glass-heavy` material.
- **Layer 4 — Sidebar:** Slides over content, `glass-heavy` material.

### Glass Material System
| Name | backdrop-filter blur | background opacity | Use |
|---|---|---|---|
| `glass-heavy` | 24px | 80% | Topbar, Sidebar |
| `glass-mid` | 16px | 60% | Dashboard tiles |
| `glass-light` | 8px | 40% | Sub-item chips, tooltips |

Each glass surface has a `::before` pseudo-element: a 1px top-border gradient `rgba(255,255,255,0.15) → transparent` simulating a specular highlight from an overhead light source.

### Typography
- Font: System font stack (San Francisco on Mac, Segoe UI on Windows, fallback to Inter)
- Logo: Bold, `--accent-cyan` for the X characters
- Nav labels: 14px, `--text-primary`
- Dashboard tile labels: 13px, `--text-muted`
- Tagline: 13px, mixed colored spans

---

## 5. Dashboard Grid (Spatial Launchpad)

### Layout
- 6 tiles in a 3×2 grid (`grid-template-columns: repeat(3, 1fr)`)
- Gap: 24px
- Responsive: 2×3 on tablet, 1×6 on mobile

### Tile Anatomy
```
┌─────────────────────────────┐
│  [specular highlight line]  │
│                             │
│         [icon 56px]         │
│        [glow halo]          │
│                             │
│       [Section Name]        │
│  [circuit texture 6% bg]   │
└─────────────────────────────┘
```
- `glass-mid` material
- Icon: 56px, colored per section accent
- Glow halo: radial gradient behind icon, 40% opacity, section accent color
- Circuit texture: tiled SVG pattern at 6% opacity inside tile

### Tile Interactions
- **Hover:** `use:tilt` activates (±8° rotateX/Y), border glow intensifies, icon scales 1.0 → 1.1 (spring), halo expands
- **Click to expand:** Tile grows with layout spring, sub-items appear as pill chips below the icon, each chip staggers in at 30ms intervals
- **Active tile:** Accent-colored border + strong glow, `translateZ(8px)` elevation

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
| `use:tilt` | `tilt.js` | 3D perspective tilt on mousemove, spring-smoothed, resets on mouseleave |
| `use:parallax` | `parallax.js` | Translates element based on global mouse position × depth prop |
| `use:magnetic` | `magnetic.js` | Element softly pulls toward cursor within 60px radius at 30% strength, springs back on mouseleave |

### Global Mouse Store (`src/lib/stores/mouse.js`)
- Tracks `mouseX` and `mouseY` as normalized values (-1 to 1) relative to viewport center
- Updated on `window.mousemove` in `+layout.svelte`
- Consumed by `use:parallax` and `use:tilt` actions

### Page Transitions
- Svelte `crossfade` store in `+layout.svelte`
- Outgoing page: blur increases + scale 1.0 → 0.96 + opacity 1 → 0
- Incoming page: scale 1.04 → 1.0 + opacity 0 → 1

### Reduced Motion
All spring values and keyframe animations check `@media (prefers-reduced-motion: reduce)` — switches to instant (0ms) transitions.

---

## 7. Component Architecture

### File Structure
```
src/
├── lib/
│   ├── stores/
│   │   ├── navigation.js     ← sidebarOpen, activeSection, expandedSections (Set)
│   │   ├── theme.js          ← darkMode (bool), scrolled (bool)
│   │   └── mouse.js          ← mouseX, mouseY (normalized -1 to 1)
│   ├── actions/
│   │   ├── tilt.js           ← use:tilt
│   │   ├── parallax.js       ← use:parallax={depth}
│   │   └── magnetic.js       ← use:magnetic
│   ├── motion/
│   │   └── springs.js        ← spring preset constants
│   └── components/
│       ├── Topbar.svelte
│       ├── Sidebar.svelte
│       ├── NavItem.svelte
│       ├── DashboardGrid.svelte
│       ├── DashboardTile.svelte
│       ├── OrbBackground.svelte
│       └── GlassPanel.svelte
├── routes/
│   ├── +layout.svelte        ← mouse store init, topbar + sidebar wrapper
│   └── +page.svelte          ← dashboard content (DashboardGrid)
└── app.css                   ← CSS tokens, glass materials, reset
```

### Component Responsibilities

**`+layout.svelte`**
- Initializes mouse store listener
- Renders OrbBackground + Topbar + Sidebar + `<slot />`
- Manages scroll detection (IntersectionObserver on a sentinel element at 80px)

**`Topbar.svelte`**
- Reads `$scrolled` and `$sidebarOpen` from stores
- Renders floating glass bar; conditionally shows hamburger vs. nav items
- Tagline secondary bar with marquee animation

**`Sidebar.svelte`**
- Reads `$sidebarOpen`
- `fly` transition from left + spring
- Renders list of `NavItem` components
- Backdrop element closes sidebar on click

**`NavItem.svelte`**
- Props: `icon`, `label`, `accent`, `subItems[]`, `expandable`
- Internal `expanded` boolean drives sub-item height spring
- `use:magnetic` on the label

**`DashboardGrid.svelte`**
- 3×2 CSS grid
- Renders 6 `DashboardTile` components

**`DashboardTile.svelte`**
- Props: `icon`, `label`, `accent`, `subItems[]`
- `use:tilt` on root element
- Internal `expanded` boolean drives sub-item chip reveal
- `glass-mid` material with circuit texture

**`OrbBackground.svelte`**
- Fixed full-viewport backdrop
- 3 orb divs with CSS keyframe drift + `use:parallax`
- Circuit grid SVG overlay

**`GlassPanel.svelte`**
- Reusable wrapper applying glass material class
- Props: `variant` (`heavy` | `mid` | `light`), `glow` (boolean)

---

## 8. SvelteKit Configuration

- SvelteKit with static adapter (no SSR needed for this UI shell)
- **Svelte 5** — use runes syntax (`$props()`, `$state()`, `$derived()`); `{@render children()}` replaces `<slot />`; stores from `svelte/store` still used for cross-component state
- Vite dev server
- No additional CSS framework — custom CSS with CSS custom properties
- No JS animation library — Svelte's built-in `spring()` and `tweened()` from `svelte/motion`

---

## 9. Out of Scope

- Backend API integration
- Authentication / real user management
- Actual content for sub-pages (IntegraXion, DataXMining, etc.)
- Light mode (dark mode only per spec)
- Mobile-specific nav patterns beyond responsive grid
