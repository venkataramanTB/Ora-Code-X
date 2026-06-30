# OraCodeX Nexus — Neomorphic Spatial UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the OraCodeX Nexus UI shell in SvelteKit — a neomorphic spatial dark-mode layout with a scroll-aware floating topbar, hamburger-triggered sidebar, physics-based spring animations, 3D tilt with dynamic shadow shifting, and a bento grid dashboard launchpad.

**Architecture:** SvelteKit static site with Svelte 5 runes. Global state lives in three writable stores (`navigation`, `theme/scroll`, `mouse`). Three Svelte actions (`tilt`, `parallax`, `magnetic`) share the mouse store for coordinated spatial effects. Components compose from a `NeoPanel` base with elevation-scaled neomorphic shadows.

**Tech Stack:** SvelteKit + Svelte 5, `@sveltejs/adapter-static`, `lucide-svelte`, `@fontsource/inter`, Vitest, `@testing-library/svelte`

## Global Constraints

- Svelte 5 runes throughout: `$props()`, `$state()`, `$derived()`, `$effect()`; `{@render children()}` in layout, never `<slot>`
- All surfaces use exactly `--bg-base: #13171f` as background — neomorphic illusion breaks if element color differs from base
- No transparency, no `backdrop-filter` — dark mode only, no toggle
- `@media (prefers-reduced-motion: reduce)` must disable all springs/animations
- File paths are exact — do not rename or reorganize
- Nav labels with "X" suffix: the X character renders in `--accent-cyan` via a `<span class="x-char">`

---

## File Map

```
src/
├── app.html                          ← SvelteKit entry (set lang="en", dark bg in body style)
├── app.css                           ← tokens, neo utilities, reset, font import, animations
├── test-setup.js                     ← @testing-library/jest-dom import
├── lib/
│   ├── data/
│   │   ├── nav.js                    ← NAV_ITEMS array + TAGLINE object
│   │   └── icons.js                  ← ICON_MAP: { iconName → LucideSvelteComponent }
│   ├── stores/
│   │   ├── navigation.js             ← sidebarOpen, activeSection, expandedSections
│   │   ├── theme.js                  ← scrolled
│   │   └── mouse.js                  ← mouseX, mouseY (normalized -1 to 1)
│   ├── actions/
│   │   ├── tilt.js                   ← use:tilt — 3D rotate + --tilt-x/--tilt-y CSS vars
│   │   ├── parallax.js               ← use:parallax={depth} — mouse-driven translate
│   │   └── magnetic.js               ← use:magnetic — cursor pull within 60px
│   ├── motion/
│   │   └── springs.js                ← snappy / bouncy / floaty preset objects
│   └── components/
│       ├── NeoPanel.svelte           ← neomorphic surface wrapper (elevation + state props)
│       ├── OrbBackground.svelte      ← fixed backdrop: 3 drifting radial-gradient orbs
│       ├── NavItem.svelte            ← icon + label + expandable sub-items (sidebar use)
│       ├── Sidebar.svelte            ← slide-in nav panel, reads sidebarOpen store
│       ├── Topbar.svelte             ← floating bar, scrolled-aware, marquee tagline
│       ├── DashboardTile.svelte      ← bento tile: hero/wide/small sizes, 3D tilt
│       └── DashboardGrid.svelte      ← CSS grid-template-areas bento layout
└── routes/
    ├── +layout.svelte                ← mouse listener, scroll sentinel, composes layout
    └── +page.svelte                  ← renders DashboardGrid
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json` (via scaffold)
- Modify: `svelte.config.js`
- Modify: `vite.config.js`
- Modify: `src/app.html`
- Create: `src/test-setup.js`

**Interfaces:**
- Produces: working `npm run dev`, `npm test` commands; `$lib` alias resolves to `src/lib`

- [ ] **Step 1: Create SvelteKit project**

```bash
cd "C:\Users\Venkataraman TB\Documents\GitHub\Ora Code X"
npx sv create . --template skeleton --no-types
```

When prompted:
- Add type checking: **No**
- Add ESLint: **Yes**
- Add Prettier: **Yes**
- Add Vitest: **Yes**
- Add Playwright: **No**

- [ ] **Step 2: Install extra dependencies**

```bash
npm install @sveltejs/adapter-static @fontsource/inter lucide-svelte
npm install -D @testing-library/svelte @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Configure static adapter in `svelte.config.js`**

Replace entire file content:

```js
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({ fallback: 'index.html' })
  }
};

export default config;
```

- [ ] **Step 4: Add Vitest config to `vite.config.js`**

Replace entire file content:

```js
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['src/**/*.{test,spec}.js'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test-setup.js']
  }
});
```

- [ ] **Step 5: Create `src/test-setup.js`**

```js
import '@testing-library/jest-dom';
```

- [ ] **Step 6: Update `src/app.html` — set dark background to prevent flash**

Find the `<body>` tag and replace with:

```html
<body style="background:#13171f" data-sveltekit-preload-data="hover">
```

- [ ] **Step 7: Add test script to `package.json`**

Ensure these scripts exist (merge with existing):

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

- [ ] **Step 8: Verify scaffold works**

```bash
npm run dev
```

Expected: dev server starts on `http://localhost:5173`, no errors in terminal.

```bash
npm run test:run
```

Expected: `No test files found` (0 tests, exit 0).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold SvelteKit project with static adapter and Vitest"
```

---

### Task 2: CSS Design System

**Files:**
- Modify: `src/app.css`

**Interfaces:**
- Produces: CSS classes `.neo-convex`, `.neo-concave`, `.neo-flat`, `.elev-1` through `.elev-4`, `.neo-tiltable`, CSS custom properties for all color tokens, `@keyframes marquee`, `@keyframes drift1/2/3`

- [ ] **Step 1: Replace `src/app.css` entirely**

```css
@import '@fontsource/inter/400.css';
@import '@fontsource/inter/500.css';
@import '@fontsource/inter/700.css';

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  /* Neomorphic foundation — ALL surfaces must use --bg-base as background */
  --bg-base: #13171f;
  --shadow-light: rgba(255, 255, 255, 0.045);
  --shadow-dark:  rgba(0, 0, 0, 0.55);

  /* Accent colors */
  --accent-cyan:   #00d4ff;
  --accent-gold:   #f5a623;
  --accent-pink:   #ff4d6d;
  --accent-green:  #00e676;
  --accent-sky:    #4fc3f7;
  --accent-purple: #b39ddb;
  --accent-orange: #ff9800;

  /* Accent glows (radial halo behind icons) */
  --accent-glow-cyan:   rgba(0,   212, 255, 0.12);
  --accent-glow-gold:   rgba(245, 166,  35, 0.12);
  --accent-glow-pink:   rgba(255,  77, 109, 0.12);
  --accent-glow-green:  rgba(0,   230, 118, 0.12);
  --accent-glow-sky:    rgba(79,  195, 247, 0.12);
  --accent-glow-purple: rgba(179, 157, 219, 0.12);

  /* Text */
  --text-primary: #c8d0e0;
  --text-muted:   #6b7a99;
  --text-accent:  #e8edf5;
}

html, body {
  height: 100%;
  background-color: var(--bg-base);
  color: var(--text-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

/* ── Neomorphic surface states ───────────────────────────── */

.neo-convex {
  background: var(--bg-base);
  box-shadow:
    -8px -8px 16px var(--shadow-light),
     8px  8px 16px var(--shadow-dark);
}

.neo-concave {
  background: var(--bg-base);
  box-shadow:
    inset -4px -4px 8px var(--shadow-light),
    inset  4px  4px 8px var(--shadow-dark);
}

.neo-flat {
  background: var(--bg-base);
  box-shadow:
    -4px -4px 8px var(--shadow-light),
     4px  4px 8px var(--shadow-dark);
}

/* ── Elevation scale ─────────────────────────────────────── */

.elev-1 {
  box-shadow:
    -4px  -4px  8px var(--shadow-light),
     4px   4px  8px var(--shadow-dark);
}
.elev-2 {
  box-shadow:
    -8px  -8px 16px var(--shadow-light),
     8px   8px 16px var(--shadow-dark);
}
.elev-3 {
  box-shadow:
    -12px -12px 24px var(--shadow-light),
     12px  12px 24px var(--shadow-dark);
}
.elev-4 {
  box-shadow:
    -16px -16px 32px var(--shadow-light),
     16px  16px 32px var(--shadow-dark);
}

/* ── Dynamic shadow tilt ─────────────────────────────────── */
/* use:tilt sets --tilt-x and --tilt-y as unitless degree numbers */

.neo-tiltable {
  box-shadow:
    calc(-8px  + var(--tilt-y, 0) * 1.2px) calc(-8px  + var(--tilt-x, 0) * 1.2px) 20px var(--shadow-light),
    calc( 8px  + var(--tilt-y, 0) * 1.2px) calc( 8px  + var(--tilt-x, 0) * 1.2px) 20px var(--shadow-dark);
}

/* ── X character accent ──────────────────────────────────── */

.x-char {
  color: var(--accent-cyan);
  text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
}

/* ── Marquee animation ───────────────────────────────────── */

@keyframes marquee {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

/* ── Orb drift animations ────────────────────────────────── */

@keyframes drift1 {
  0%, 100% { transform: translate(0,     0);    }
  25%       { transform: translate(-30px,  20px); }
  50%       { transform: translate( 20px, -30px); }
  75%       { transform: translate(-10px,  40px); }
}

@keyframes drift2 {
  0%, 100% { transform: translate(0,     0);    }
  33%       { transform: translate( 40px, -25px); }
  66%       { transform: translate(-20px,  35px); }
}

@keyframes drift3 {
  0%, 100% { transform: translate(0,    0);   }
  50%       { transform: translate(25px, 25px); }
}

/* ── Reduced motion ──────────────────────────────────────── */

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: Import `app.css` in layout (placeholder until Task 12)**

Open `src/routes/+layout.svelte` (created by scaffold) and ensure this line is present in the `<script>` block:

```js
import '../app.css';
```

- [ ] **Step 3: Commit**

```bash
git add src/app.css src/routes/+layout.svelte
git commit -m "feat: add neomorphic CSS design system with tokens and shadow utilities"
```

---

### Task 3: Navigation Data & Stores

**Files:**
- Create: `src/lib/data/nav.js`
- Create: `src/lib/data/icons.js`
- Create: `src/lib/stores/navigation.js`
- Create: `src/lib/stores/theme.js`
- Create: `src/lib/stores/mouse.js`
- Create: `src/lib/stores/navigation.test.js`
- Create: `src/lib/stores/mouse.test.js`

**Interfaces:**
- Produces:
  - `NAV_ITEMS: Array<{id, label, iconName, accent, accentGlow, gridArea, size, subItems}>`
  - `TAGLINE: {prefix, brand, separator, keywords: Array<{word, color}>}`
  - `ICON_MAP: Record<string, SvelteComponent>`
  - `sidebarOpen: Writable<boolean>`, `activeSection: Writable<string>`, `expandedSections: Writable<Set<string>>`
  - `scrolled: Writable<boolean>`
  - `mouseX: Writable<number>`, `mouseY: Writable<number>` (normalized -1 to 1)

- [ ] **Step 1: Write failing store tests**

Create `src/lib/stores/navigation.test.js`:

```js
import { get } from 'svelte/store';
import { describe, it, expect, beforeEach } from 'vitest';
import { sidebarOpen, activeSection, expandedSections } from './navigation.js';

beforeEach(() => {
  sidebarOpen.set(false);
  activeSection.set('');
  expandedSections.set(new Set());
});

describe('sidebarOpen', () => {
  it('starts false', () => {
    expect(get(sidebarOpen)).toBe(false);
  });
  it('toggles to true', () => {
    sidebarOpen.update(v => !v);
    expect(get(sidebarOpen)).toBe(true);
  });
});

describe('expandedSections', () => {
  it('starts empty', () => {
    expect(get(expandedSections).size).toBe(0);
  });
  it('can add a section id', () => {
    expandedSections.update(s => { s.add('delivery'); return s; });
    expect(get(expandedSections).has('delivery')).toBe(true);
  });
  it('can remove a section id', () => {
    expandedSections.update(s => { s.add('delivery'); return s; });
    expandedSections.update(s => { s.delete('delivery'); return s; });
    expect(get(expandedSections).has('delivery')).toBe(false);
  });
});
```

Create `src/lib/stores/mouse.test.js`:

```js
import { get } from 'svelte/store';
import { describe, it, expect } from 'vitest';
import { mouseX, mouseY } from './mouse.js';

describe('mouse store', () => {
  it('mouseX starts at 0', () => {
    expect(get(mouseX)).toBe(0);
  });
  it('mouseY starts at 0', () => {
    expect(get(mouseY)).toBe(0);
  });
  it('accepts normalized values between -1 and 1', () => {
    mouseX.set(0.5);
    expect(get(mouseX)).toBe(0.5);
    mouseY.set(-0.75);
    expect(get(mouseY)).toBe(-0.75);
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm run test:run
```

Expected: FAIL — `Cannot find module './navigation.js'` and `./mouse.js`

- [ ] **Step 3: Create `src/lib/stores/navigation.js`**

```js
import { writable } from 'svelte/store';

export const sidebarOpen = writable(false);
export const activeSection = writable('');
export const expandedSections = writable(new Set());
```

- [ ] **Step 4: Create `src/lib/stores/theme.js`**

```js
import { writable } from 'svelte/store';

export const scrolled = writable(false);
```

- [ ] **Step 5: Create `src/lib/stores/mouse.js`**

```js
import { writable } from 'svelte/store';

export const mouseX = writable(0);
export const mouseY = writable(0);
```

- [ ] **Step 6: Run tests — expect pass**

```bash
npm run test:run
```

Expected: PASS — 6 tests pass.

- [ ] **Step 7: Create `src/lib/data/nav.js`**

```js
export const NAV_ITEMS = [
  {
    id: 'delivery',
    label: 'DeliveryX',
    iconName: 'Rocket',
    accent: '#00d4ff',
    accentGlow: 'rgba(0, 212, 255, 0.15)',
    gridArea: 'delivery',
    size: 'hero',
    subItems: [
      { label: 'Oracle Cloud ConverXion', href: '/delivery/conversion' },
      { label: 'IntegraXion',             href: '/delivery/integration' },
      { label: 'Cross ValidaXion',        href: '/delivery/validation'  },
      { label: 'DataXMining',             href: '/delivery/mining'      },
      { label: 'Cloud OperaXions',        href: '/delivery/operations'  }
    ]
  },
  {
    id: 'mytools',
    label: 'My Tools',
    iconName: 'Wrench',
    accent: '#f5a623',
    accentGlow: 'rgba(245, 166, 35, 0.15)',
    gridArea: 'mytools',
    size: 'small',
    subItems: []
  },
  {
    id: 'workspace',
    label: 'Work Space',
    iconName: 'LayoutDashboard',
    accent: '#ff4d6d',
    accentGlow: 'rgba(255, 77, 109, 0.15)',
    gridArea: 'workspace',
    size: 'small',
    subItems: []
  },
  {
    id: 'monitoring',
    label: 'Monitoring',
    iconName: 'Activity',
    accent: '#00e676',
    accentGlow: 'rgba(0, 230, 118, 0.15)',
    gridArea: 'monitor',
    size: 'wide',
    subItems: []
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    iconName: 'PieChart',
    accent: '#4fc3f7',
    accentGlow: 'rgba(79, 195, 247, 0.15)',
    gridArea: 'dashboard',
    size: 'small',
    subItems: []
  },
  {
    id: 'admin',
    label: 'Administration',
    iconName: 'Shield',
    accent: '#b39ddb',
    accentGlow: 'rgba(179, 157, 219, 0.15)',
    gridArea: 'admin',
    size: 'wide',
    subItems: []
  }
];

export const TAGLINE = {
  prefix: 'Welcome to ',
  brand: 'OraCodeX Nexus',
  separator: ' — The Intelligent Oracle Cloud Delivery Platform | ',
  keywords: [
    { word: 'Extract',   color: '#ff4d6d' },
    { word: 'Convert',   color: '#00d4ff' },
    { word: 'Integrate', color: '#00e676' },
    { word: 'Actions',   color: '#ff9800' },
    { word: 'Validate',  color: '#b39ddb' },
    { word: 'Deliver',   color: '#4fc3f7' }
  ]
};
```

- [ ] **Step 8: Create `src/lib/data/icons.js`**

```js
import {
  Rocket, Wrench, LayoutDashboard, Activity,
  PieChart, Shield, Menu, X, Search, User,
  ChevronRight, ChevronDown
} from 'lucide-svelte';

export const ICON_MAP = {
  Rocket, Wrench, LayoutDashboard, Activity,
  PieChart, Shield, Menu, X, Search, User,
  ChevronRight, ChevronDown
};
```

- [ ] **Step 9: Commit**

```bash
git add src/lib/
git commit -m "feat: add nav data, icon map, and Svelte stores"
```

---

### Task 4: Spring Config & Svelte Actions

**Files:**
- Create: `src/lib/motion/springs.js`
- Create: `src/lib/actions/tilt.js`
- Create: `src/lib/actions/parallax.js`
- Create: `src/lib/actions/magnetic.js`
- Create: `src/lib/actions/tilt.test.js`

**Interfaces:**
- Produces:
  - `snappy`, `bouncy`, `floaty`: `{ stiffness: number, damping: number }`
  - `tilt(node, { maxAngle?: number })`: Svelte action — sets CSS `--tilt-x`, `--tilt-y`, updates `transform`
  - `parallax(node, depth: number)`: Svelte action — translates element from mouse store
  - `magnetic(node, { radius?: number, strength?: number })`: Svelte action — pulls toward cursor

- [ ] **Step 1: Write failing tilt action tests**

Create `src/lib/actions/tilt.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tilt } from './tilt.js';

function makeNode() {
  const node = document.createElement('div');
  Object.defineProperty(node, 'getBoundingClientRect', {
    value: () => ({ left: 100, top: 100, width: 200, height: 200 })
  });
  document.body.appendChild(node);
  return node;
}

describe('tilt action', () => {
  let node;
  beforeEach(() => {
    node = makeNode();
  });

  it('initializes --tilt-x and --tilt-y to 0', () => {
    tilt(node);
    expect(node.style.getPropertyValue('--tilt-x')).toBe('0');
    expect(node.style.getPropertyValue('--tilt-y')).toBe('0');
  });

  it('returns a destroy function', () => {
    const instance = tilt(node);
    expect(typeof instance.destroy).toBe('function');
  });

  it('cleans up listeners on destroy', () => {
    const spy = vi.spyOn(node, 'removeEventListener');
    const instance = tilt(node);
    instance.destroy();
    expect(spy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(spy).toHaveBeenCalledWith('mouseleave', expect.any(Function));
  });
});
```

- [ ] **Step 2: Run — expect failure**

```bash
npm run test:run -- tilt
```

Expected: FAIL — `Cannot find module './tilt.js'`

- [ ] **Step 3: Create `src/lib/motion/springs.js`**

```js
export const snappy = { stiffness: 0.3, damping: 0.8 };
export const bouncy = { stiffness: 0.2, damping: 0.6 };
export const floaty = { stiffness: 0.08, damping: 0.5 };
```

- [ ] **Step 4: Create `src/lib/actions/tilt.js`**

```js
import { spring } from 'svelte/motion';
import { get } from 'svelte/store';
import { snappy } from '$lib/motion/springs.js';

export function tilt(node, options = {}) {
  let maxAngle = options.maxAngle ?? 8;

  const rxSpring = spring(0, snappy);
  const rySpring = spring(0, snappy);

  node.style.setProperty('--tilt-x', '0');
  node.style.setProperty('--tilt-y', '0');
  node.style.transformStyle = 'preserve-3d';

  const unsubRx = rxSpring.subscribe(val => {
    node.style.setProperty('--tilt-x', String(Math.round(val * 100) / 100));
    node.style.transform = `perspective(1000px) rotateX(${val}deg) rotateY(${get(rySpring)}deg)`;
  });

  const unsubRy = rySpring.subscribe(val => {
    node.style.setProperty('--tilt-y', String(Math.round(val * 100) / 100));
    node.style.transform = `perspective(1000px) rotateX(${get(rxSpring)}deg) rotateY(${val}deg)`;
  });

  function onMouseMove(e) {
    const rect = node.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const relX = (e.clientX - cx) / (rect.width / 2);
    const relY = (e.clientY - cy) / (rect.height / 2);
    rxSpring.set(-relY * maxAngle);
    rySpring.set(relX * maxAngle);
  }

  function onMouseLeave() {
    rxSpring.set(0);
    rySpring.set(0);
  }

  node.addEventListener('mousemove', onMouseMove);
  node.addEventListener('mouseleave', onMouseLeave);

  return {
    update(newOptions) {
      maxAngle = newOptions.maxAngle ?? 8;
    },
    destroy() {
      node.removeEventListener('mousemove', onMouseMove);
      node.removeEventListener('mouseleave', onMouseLeave);
      unsubRx();
      unsubRy();
    }
  };
}
```

- [ ] **Step 5: Create `src/lib/actions/parallax.js`**

```js
import { derived } from 'svelte/store';
import { mouseX, mouseY } from '$lib/stores/mouse.js';

const mousePos = derived([mouseX, mouseY], ([$x, $y]) => ({ x: $x, y: $y }));

export function parallax(node, depth = 0.05) {
  let d = depth;

  const unsub = mousePos.subscribe(({ x, y }) => {
    const dx = x * 120 * d;
    const dy = y * 80 * d;
    node.style.transform = `translate(${dx}px, ${dy}px)`;
  });

  return {
    update(newDepth) { d = newDepth; },
    destroy() { unsub(); }
  };
}
```

- [ ] **Step 6: Create `src/lib/actions/magnetic.js`**

```js
import { spring } from 'svelte/motion';
import { snappy } from '$lib/motion/springs.js';

export function magnetic(node, options = {}) {
  const { radius = 60, strength = 0.3 } = options;
  let currentX = 0;
  let currentY = 0;

  const txSpring = spring(0, snappy);
  const tySpring = spring(0, snappy);

  const unsubX = txSpring.subscribe(val => {
    currentX = val;
    node.style.transform = `translate(${currentX}px, ${currentY}px)`;
  });

  const unsubY = tySpring.subscribe(val => {
    currentY = val;
    node.style.transform = `translate(${currentX}px, ${currentY}px)`;
  });

  function onWindowMouseMove(e) {
    const rect = node.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < radius) {
      txSpring.set(dx * strength);
      tySpring.set(dy * strength);
    } else {
      txSpring.set(0);
      tySpring.set(0);
    }
  }

  window.addEventListener('mousemove', onWindowMouseMove);

  return {
    destroy() {
      window.removeEventListener('mousemove', onWindowMouseMove);
      unsubX();
      unsubY();
    }
  };
}
```

- [ ] **Step 7: Run tests — expect pass**

```bash
npm run test:run
```

Expected: PASS — 9 tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/lib/
git commit -m "feat: add spring presets and tilt/parallax/magnetic Svelte actions"
```

---

### Task 5: NeoPanel & OrbBackground Components

**Files:**
- Create: `src/lib/components/NeoPanel.svelte`
- Create: `src/lib/components/OrbBackground.svelte`
- Create: `src/lib/components/NeoPanel.test.js`

**Interfaces:**
- Consumes: CSS classes from `app.css` (`.neo-convex`, `.neo-concave`, `.neo-flat`, `.elev-1` through `.elev-4`)
- Produces:
  - `NeoPanel`: renders `<div class="neo-{state} elev-{elevation}">` wrapping `{@render children()}`; props: `elevation: 1|2|3|4`, `state: 'convex'|'concave'|'flat'`, `radius: number`, `glow: boolean`, `glowColor: string`
  - `OrbBackground`: fixed full-viewport backdrop with 3 drifting orb divs + `use:parallax`

- [ ] **Step 1: Write failing NeoPanel tests**

Create `src/lib/components/NeoPanel.test.js`:

```js
import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import NeoPanel from './NeoPanel.svelte';

describe('NeoPanel', () => {
  it('applies neo-convex class by default', () => {
    const { container } = render(NeoPanel, { props: { elevation: 2 } });
    expect(container.firstChild).toHaveClass('neo-convex');
  });

  it('applies neo-concave when state=concave', () => {
    const { container } = render(NeoPanel, { props: { elevation: 2, state: 'concave' } });
    expect(container.firstChild).toHaveClass('neo-concave');
  });

  it('applies correct elevation class', () => {
    const { container } = render(NeoPanel, { props: { elevation: 3 } });
    expect(container.firstChild).toHaveClass('elev-3');
  });

  it('applies border-radius from radius prop', () => {
    const { container } = render(NeoPanel, { props: { elevation: 2, radius: 24 } });
    expect(container.firstChild.style.borderRadius).toBe('24px');
  });
});
```

- [ ] **Step 2: Run — expect failure**

```bash
npm run test:run -- NeoPanel
```

Expected: FAIL — `Cannot find module './NeoPanel.svelte'`

- [ ] **Step 3: Create `src/lib/components/NeoPanel.svelte`**

```svelte
<script>
  let {
    elevation = 2,
    state = 'convex',
    radius = 20,
    glow = false,
    glowColor = 'var(--accent-cyan)',
    children
  } = $props();
</script>

<div
  class="neo-panel neo-{state} elev-{elevation}"
  style:border-radius="{radius}px"
  style:box-shadow={glow
    ? `0 0 24px 4px ${glowColor}, -${elevation * 2}px -${elevation * 2}px ${elevation * 4}px var(--shadow-light), ${elevation * 2}px ${elevation * 2}px ${elevation * 4}px var(--shadow-dark)`
    : undefined}
>
  {@render children?.()}
</div>

<style>
  .neo-panel {
    background: var(--bg-base);
    position: relative;
  }
</style>
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm run test:run -- NeoPanel
```

Expected: PASS — 4 tests pass.

- [ ] **Step 5: Create `src/lib/components/OrbBackground.svelte`**

```svelte
<script>
  import { parallax } from '$lib/actions/parallax.js';
</script>

<div class="orb-container" aria-hidden="true">
  <div class="orb orb-1" use:parallax={0.015}></div>
  <div class="orb orb-2" use:parallax={0.02}></div>
  <div class="orb orb-3" use:parallax={0.01}></div>
</div>

<style>
  .orb-container {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
  }

  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.06;
  }

  .orb-1 {
    width: 600px; height: 600px;
    top: -200px; right: -100px;
    background: radial-gradient(circle, rgba(0, 212, 255, 1), transparent 70%);
    animation: drift1 90s ease-in-out infinite;
  }

  .orb-2 {
    width: 500px; height: 500px;
    bottom: -150px; left: -100px;
    background: radial-gradient(circle, rgba(245, 166, 35, 1), transparent 70%);
    animation: drift2 75s ease-in-out infinite;
  }

  .orb-3 {
    width: 400px; height: 400px;
    top: 30%; left: 30%;
    background: radial-gradient(circle, rgba(60, 20, 120, 1), transparent 70%);
    animation: drift3 110s ease-in-out infinite;
  }
</style>
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/
git commit -m "feat: add NeoPanel component and OrbBackground"
```

---

### Task 6: NavItem Component

**Files:**
- Create: `src/lib/components/NavItem.svelte`
- Create: `src/lib/components/NavItem.test.js`

**Interfaces:**
- Consumes: `ICON_MAP` from `$lib/data/icons.js`; `magnetic` action from `$lib/actions/magnetic.js`; `expandedSections` store from `$lib/stores/navigation.js`
- Produces: `NavItem` component — props: `id: string`, `label: string`, `iconName: string`, `accent: string`, `subItems: Array<{label,href}>`, `expandable: boolean`

- [ ] **Step 1: Write failing tests**

Create `src/lib/components/NavItem.test.js`:

```js
import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import NavItem from './NavItem.svelte';

const baseProps = {
  id: 'test',
  label: 'DeliveryX',
  iconName: 'Rocket',
  accent: '#00d4ff',
  subItems: [{ label: 'Sub Item', href: '/sub' }],
  expandable: true
};

describe('NavItem', () => {
  it('renders the label', () => {
    const { getByText } = render(NavItem, { props: baseProps });
    expect(getByText('DeliveryX')).toBeTruthy();
  });

  it('does not show sub-items initially', () => {
    const { queryByText } = render(NavItem, { props: baseProps });
    expect(queryByText('Sub Item')).toBeNull();
  });

  it('shows sub-items after clicking', async () => {
    const { getByRole, findByText } = render(NavItem, { props: baseProps });
    await fireEvent.click(getByRole('button'));
    expect(await findByText('Sub Item')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run — expect failure**

```bash
npm run test:run -- NavItem
```

Expected: FAIL — `Cannot find module './NavItem.svelte'`

- [ ] **Step 3: Create `src/lib/components/NavItem.svelte`**

```svelte
<script>
  import { ICON_MAP } from '$lib/data/icons.js';
  import { magnetic } from '$lib/actions/magnetic.js';

  let { id, label, iconName, accent, subItems = [], expandable = false } = $props();

  let expanded = $state(false);

  const Icon = ICON_MAP[iconName];
  const Chevron = ICON_MAP['ChevronDown'];

  function formatLabel(text) {
    return text.replace(/X/g, '<span class="x-char">X</span>');
  }
</script>

<div class="nav-item-wrapper">
  <button
    class="nav-item"
    class:expandable
    onclick={() => { if (expandable) expanded = !expanded; }}
    style="--item-accent: {accent}"
    use:magnetic
  >
    <span class="nav-icon" style="color: {accent}">
      <Icon size={20} />
    </span>
    <span class="nav-label">{@html formatLabel(label)}</span>
    {#if expandable}
      <span class="nav-chevron" class:rotated={expanded}>
        <Chevron size={14} />
      </span>
    {/if}
  </button>

  {#if expanded && subItems.length}
    <ul class="sub-items" role="list">
      {#each subItems as item, i}
        <li
          class="sub-item neo-concave elev-1"
          style="animation-delay: {i * 30}ms"
        >
          <a href={item.href}>{@html formatLabel(item.label)}</a>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .nav-item-wrapper {
    width: 100%;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 10px 16px;
    background: none;
    border: none;
    color: var(--text-primary);
    cursor: pointer;
    border-radius: 12px;
    transition: background 0.15s, color 0.15s;
    text-align: left;
  }

  .nav-item:hover {
    background: rgba(255, 255, 255, 0.03);
    color: var(--text-accent);
  }

  .nav-item:hover .nav-icon {
    filter: drop-shadow(0 0 6px var(--item-accent));
  }

  .nav-label {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.01em;
  }

  .nav-chevron {
    transition: transform 0.2s ease;
    color: var(--text-muted);
  }

  .nav-chevron.rotated {
    transform: rotate(-180deg);
  }

  .sub-items {
    list-style: none;
    padding: 4px 8px 4px 44px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .sub-item {
    border-radius: 8px;
    opacity: 0;
    animation: fadeSlideIn 0.2s ease forwards;
  }

  .sub-item a {
    display: block;
    padding: 7px 12px;
    color: var(--text-muted);
    text-decoration: none;
    font-size: 13px;
    border-radius: 8px;
    transition: color 0.15s;
  }

  .sub-item a:hover {
    color: var(--text-accent);
  }

  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
  }
</style>
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm run test:run -- NavItem
```

Expected: PASS — 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/NavItem.svelte src/lib/components/NavItem.test.js
git commit -m "feat: add NavItem component with expand/collapse sub-items"
```

---

### Task 7: Sidebar Component

**Files:**
- Create: `src/lib/components/Sidebar.svelte`
- Create: `src/lib/components/Sidebar.test.js`

**Interfaces:**
- Consumes: `sidebarOpen` from `$lib/stores/navigation.js`; `NAV_ITEMS` from `$lib/data/nav.js`; `NavItem` component; `ICON_MAP` for close icon
- Produces: `Sidebar` component — no props; reads store; slide-in panel with backdrop

- [ ] **Step 1: Write failing tests**

Create `src/lib/components/Sidebar.test.js`:

```js
import { render, fireEvent } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { describe, it, expect, beforeEach } from 'vitest';
import { sidebarOpen } from '$lib/stores/navigation.js';
import Sidebar from './Sidebar.svelte';

beforeEach(() => sidebarOpen.set(false));

describe('Sidebar', () => {
  it('is hidden when sidebarOpen is false', () => {
    const { queryByRole } = render(Sidebar);
    expect(queryByRole('navigation')).toBeNull();
  });

  it('is visible when sidebarOpen is true', async () => {
    sidebarOpen.set(true);
    const { findByRole } = render(Sidebar);
    expect(await findByRole('navigation')).toBeTruthy();
  });

  it('closes when backdrop is clicked', async () => {
    sidebarOpen.set(true);
    const { findByTestId } = render(Sidebar);
    const backdrop = await findByTestId('sidebar-backdrop');
    await fireEvent.click(backdrop);
    expect(get(sidebarOpen)).toBe(false);
  });
});
```

- [ ] **Step 2: Run — expect failure**

```bash
npm run test:run -- Sidebar
```

Expected: FAIL

- [ ] **Step 3: Create `src/lib/components/Sidebar.svelte`**

```svelte
<script>
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { sidebarOpen } from '$lib/stores/navigation.js';
  import { NAV_ITEMS } from '$lib/data/nav.js';
  import { ICON_MAP } from '$lib/data/icons.js';
  import NavItem from './NavItem.svelte';

  const CloseIcon = ICON_MAP['X'];
</script>

{#if $sidebarOpen}
  <!-- Backdrop -->
  <div
    class="sidebar-backdrop"
    data-testid="sidebar-backdrop"
    onclick={() => sidebarOpen.set(false)}
    role="presentation"
  ></div>

  <!-- Panel -->
  <nav
    class="sidebar neo-convex elev-3"
    transition:fly={{ x: -320, duration: 320, easing: cubicOut }}
    aria-label="Main navigation"
  >
    <div class="sidebar-header">
      <span class="sidebar-logo">
        OraCode<span class="x-char">X</span>
      </span>
      <button
        class="close-btn"
        onclick={() => sidebarOpen.set(false)}
        aria-label="Close navigation"
      >
        <CloseIcon size={18} />
      </button>
    </div>

    <ul class="sidebar-nav" role="list">
      {#each NAV_ITEMS as item}
        <li>
          <NavItem
            id={item.id}
            label={item.label}
            iconName={item.iconName}
            accent={item.accent}
            subItems={item.subItems}
            expandable={item.subItems.length > 0}
          />
        </li>
      {/each}
    </ul>
  </nav>
{/if}

<style>
  .sidebar-backdrop {
    position: fixed;
    inset: 0;
    z-index: 30;
    background: rgba(0, 0, 0, 0.5);
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 320px;
    z-index: 40;
    display: flex;
    flex-direction: column;
    border-radius: 0 20px 20px 0;
    overflow: hidden;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 20px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .sidebar-logo {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-accent);
    letter-spacing: -0.01em;
  }

  .close-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 6px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    transition: color 0.15s;
  }

  .close-btn:hover {
    color: var(--text-accent);
  }

  .sidebar-nav {
    list-style: none;
    padding: 12px 8px;
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .sidebar-nav::-webkit-scrollbar { width: 4px; }
  .sidebar-nav::-webkit-scrollbar-track { background: transparent; }
  .sidebar-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
</style>
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm run test:run -- Sidebar
```

Expected: PASS — 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/Sidebar.svelte src/lib/components/Sidebar.test.js
git commit -m "feat: add Sidebar component with slide-in animation and backdrop close"
```

---

### Task 8: Topbar Component

**Files:**
- Create: `src/lib/components/Topbar.svelte`
- Create: `src/lib/components/Topbar.test.js`

**Interfaces:**
- Consumes: `scrolled` from `$lib/stores/theme.js`; `sidebarOpen` from `$lib/stores/navigation.js`; `NAV_ITEMS`, `TAGLINE` from `$lib/data/nav.js`; `ICON_MAP`; `magnetic` action; `spring` from `svelte/motion`
- Produces: `Topbar` component — floating bar, collapses on scroll, shows hamburger, marquee tagline

- [ ] **Step 1: Write failing tests**

Create `src/lib/components/Topbar.test.js`:

```js
import { render } from '@testing-library/svelte';
import { describe, it, expect, beforeEach } from 'vitest';
import { scrolled } from '$lib/stores/theme.js';
import Topbar from './Topbar.svelte';

beforeEach(() => scrolled.set(false));

describe('Topbar', () => {
  it('renders the logo', () => {
    const { getByText } = render(Topbar);
    expect(getByText(/OraCode/)).toBeTruthy();
  });

  it('shows nav items when not scrolled', () => {
    const { getAllByRole } = render(Topbar);
    const links = getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });

  it('shows hamburger button when scrolled', async () => {
    scrolled.set(true);
    const { findByLabelText } = render(Topbar);
    expect(await findByLabelText('Open navigation')).toBeTruthy();
  });

  it('hides nav links when scrolled', async () => {
    scrolled.set(true);
    const { queryAllByRole } = render(Topbar);
    expect(queryAllByRole('link').length).toBe(0);
  });
});
```

- [ ] **Step 2: Run — expect failure**

```bash
npm run test:run -- Topbar
```

Expected: FAIL

- [ ] **Step 3: Create `src/lib/components/Topbar.svelte`**

```svelte
<script>
  import { spring } from 'svelte/motion';
  import { scrolled } from '$lib/stores/theme.js';
  import { sidebarOpen } from '$lib/stores/navigation.js';
  import { NAV_ITEMS, TAGLINE } from '$lib/data/nav.js';
  import { ICON_MAP } from '$lib/data/icons.js';
  import { magnetic } from '$lib/actions/magnetic.js';
  import { snappy } from '$lib/motion/springs.js';

  const MenuIcon   = ICON_MAP['Menu'];
  const SearchIcon = ICON_MAP['Search'];
  const UserIcon   = ICON_MAP['User'];

  const topbarHeight  = spring(64, snappy);
  const taglineHeight = spring(36, snappy);

  $effect(() => {
    topbarHeight.set($scrolled ? 48 : 64);
    taglineHeight.set($scrolled ? 0 : 36);
  });

  function formatLabel(text) {
    return text.replace(/X/g, '<span class="x-char">X</span>');
  }
</script>

<header
  class="topbar neo-convex elev-3"
  style:height="{$topbarHeight}px"
>
  <div class="topbar-inner">
    {#if $scrolled}
      <button
        class="hamburger"
        onclick={() => sidebarOpen.update(v => !v)}
        aria-label="Open navigation"
      >
        <MenuIcon size={20} />
      </button>
    {/if}

    <span class="topbar-logo" use:magnetic>
      OraCode<span class="x-char">X</span>
    </span>

    {#if !$scrolled}
      <nav class="topbar-nav" aria-label="Top navigation">
        {#each NAV_ITEMS as item}
          {@const Icon = ICON_MAP[item.iconName]}
          <a
            class="topbar-nav-item"
            href="/{item.id}"
            style="--item-accent: {item.accent}"
            use:magnetic
          >
            <span class="topbar-nav-icon" style="color: {item.accent}">
              <Icon size={15} />
            </span>
            <span>{@html formatLabel(item.label)}</span>
          </a>
        {/each}
      </nav>
    {/if}

    <div class="topbar-actions">
      <button class="icon-btn" aria-label="Search" use:magnetic>
        <SearchIcon size={17} />
      </button>
      <button class="icon-btn" aria-label="User" use:magnetic>
        <UserIcon size={17} />
      </button>
    </div>
  </div>

  <!-- Tagline marquee bar -->
  <div class="tagline-bar" style:height="{$taglineHeight}px">
    <div class="marquee" aria-hidden="true">
      <span class="marquee-track">
        {#each [0, 1] as _}
          <span class="marquee-segment">
            {TAGLINE.prefix}<strong>{TAGLINE.brand}</strong>{TAGLINE.separator}
            {#each TAGLINE.keywords as kw, i}
              <span style="color: {kw.color}">{kw.word}</span>{i < TAGLINE.keywords.length - 1 ? '. ' : '.'}
            {/each}
            &nbsp;&nbsp;&nbsp;&nbsp;
          </span>
        {/each}
      </span>
    </div>
  </div>
</header>

<style>
  .topbar {
    position: fixed;
    top: 8px;
    left: 8px;
    right: 8px;
    z-index: 20;
    border-radius: 20px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: height 0.2s ease;
  }

  .topbar-inner {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 0 20px;
    flex: 0 0 48px;
    min-height: 48px;
  }

  .topbar-logo {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-accent);
    letter-spacing: -0.01em;
    cursor: default;
    white-space: nowrap;
  }

  .topbar-nav {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 1;
    justify-content: center;
  }

  .topbar-nav-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    color: var(--text-primary);
    text-decoration: none;
    font-size: 13px;
    font-weight: 500;
    border-radius: 10px;
    white-space: nowrap;
    transition: color 0.15s, background 0.15s;
  }

  .topbar-nav-item:hover {
    color: var(--text-accent);
    background: rgba(255, 255, 255, 0.03);
  }

  .topbar-nav-item:hover .topbar-nav-icon {
    filter: drop-shadow(0 0 5px var(--item-accent));
  }

  .topbar-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
  }

  .hamburger, .icon-btn {
    background: none;
    border: none;
    color: var(--text-primary);
    cursor: pointer;
    padding: 8px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    transition: color 0.15s, background 0.15s;
  }

  .hamburger:hover, .icon-btn:hover {
    color: var(--text-accent);
    background: rgba(255, 255, 255, 0.04);
  }

  /* Tagline marquee */
  .tagline-bar {
    overflow: hidden;
    border-top: 1px solid rgba(255, 255, 255, 0.04);
  }

  .marquee {
    overflow: hidden;
    height: 36px;
    display: flex;
    align-items: center;
  }

  .marquee-track {
    display: inline-flex;
    white-space: nowrap;
    animation: marquee 30s linear infinite;
    font-size: 12px;
    color: var(--text-muted);
    padding: 0 24px;
  }

  .marquee-segment {
    padding-right: 40px;
  }

  .marquee-segment strong {
    color: var(--text-primary);
    font-weight: 600;
  }
</style>
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm run test:run -- Topbar
```

Expected: PASS — 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/Topbar.svelte src/lib/components/Topbar.test.js
git commit -m "feat: add Topbar component with scroll-aware collapse and marquee tagline"
```

---

### Task 9: DashboardTile Component

**Files:**
- Create: `src/lib/components/DashboardTile.svelte`
- Create: `src/lib/components/DashboardTile.test.js`

**Interfaces:**
- Consumes: `tilt` action; `ICON_MAP`; `NeoPanel`
- Produces: `DashboardTile` — props: `id: string`, `label: string`, `iconName: string`, `accent: string`, `accentGlow: string`, `subItems: Array<{label,href}>`, `size: 'hero'|'wide'|'small'`, `gridArea: string`

Size → elevation, icon size, border radius, tilt angle, sub-item visibility:

| size  | elevation | icon px | radius | tilt | sub-items |
|-------|-----------|---------|--------|------|-----------|
| hero  | 4         | 72      | 24     | ±6°  | always visible |
| wide  | 3         | 52      | 20     | ±8°  | click to expand |
| small | 2         | 48      | 16     | ±8°  | click to expand |

- [ ] **Step 1: Write failing tests**

Create `src/lib/components/DashboardTile.test.js`:

```js
import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import DashboardTile from './DashboardTile.svelte';

const heroProps = {
  id: 'delivery', label: 'DeliveryX', iconName: 'Rocket',
  accent: '#00d4ff', accentGlow: 'var(--accent-glow-cyan)',
  subItems: [{ label: 'SubA', href: '/a' }, { label: 'SubB', href: '/b' }],
  size: 'hero', gridArea: 'delivery'
};

const smallProps = {
  id: 'mytools', label: 'My Tools', iconName: 'Wrench',
  accent: '#f5a623', accentGlow: 'var(--accent-glow-gold)',
  subItems: [{ label: 'Tool1', href: '/t1' }],
  size: 'small', gridArea: 'mytools'
};

describe('DashboardTile', () => {
  it('renders the label', () => {
    const { getByText } = render(DashboardTile, { props: smallProps });
    expect(getByText('My Tools')).toBeTruthy();
  });

  it('hero tile shows sub-items without clicking', () => {
    const { getByText } = render(DashboardTile, { props: heroProps });
    expect(getByText('SubA')).toBeTruthy();
  });

  it('small tile hides sub-items initially', () => {
    const { queryByText } = render(DashboardTile, { props: smallProps });
    expect(queryByText('Tool1')).toBeNull();
  });

  it('small tile reveals sub-items on click', async () => {
    const { getByRole, findByText } = render(DashboardTile, { props: smallProps });
    await fireEvent.click(getByRole('button'));
    expect(await findByText('Tool1')).toBeTruthy();
  });

  it('applies grid-area style', () => {
    const { container } = render(DashboardTile, { props: smallProps });
    expect(container.firstChild.style.gridArea).toBe('mytools');
  });
});
```

- [ ] **Step 2: Run — expect failure**

```bash
npm run test:run -- DashboardTile
```

Expected: FAIL

- [ ] **Step 3: Create `src/lib/components/DashboardTile.svelte`**

```svelte
<script>
  import { tilt } from '$lib/actions/tilt.js';
  import { ICON_MAP } from '$lib/data/icons.js';

  let { id, label, iconName, accent, accentGlow, subItems = [], size = 'small', gridArea } = $props();

  let expanded = $state(size === 'hero');
  let pressing = $state(false);

  const Icon = ICON_MAP[iconName];

  const CONFIG = {
    hero:  { elevation: 4, iconSize: 72, radius: 24, maxAngle: 6  },
    wide:  { elevation: 3, iconSize: 52, radius: 20, maxAngle: 8  },
    small: { elevation: 2, iconSize: 48, radius: 16, maxAngle: 8  }
  };

  const cfg = $derived(CONFIG[size]);

  function handleClick() {
    if (size === 'hero') return;
    pressing = true;
    setTimeout(() => { pressing = false; }, 150);
    expanded = !expanded;
  }

  function formatLabel(text) {
    return text.replace(/X/g, '<span class="x-char">X</span>');
  }
</script>

<div
  class="tile neo-convex neo-tiltable elev-{cfg.elevation}"
  class:pressing
  class:size-hero={size === 'hero'}
  class:size-wide={size === 'wide'}
  class:size-small={size === 'small'}
  style:grid-area={gridArea}
  style:border-radius="{cfg.radius}px"
  use:tilt={{ maxAngle: cfg.maxAngle }}
>
  <button
    class="tile-inner"
    onclick={handleClick}
    aria-label={label}
    aria-expanded={size !== 'hero' ? expanded : undefined}
  >
    <span class="tile-glow" style="background: radial-gradient(circle, {accentGlow} 0%, transparent 70%)"></span>

    <span class="tile-icon" style="color: {accent}; filter: drop-shadow(0 0 10px {accent}88)">
      <Icon size={cfg.iconSize} />
    </span>

    <span class="tile-label" style="--item-accent: {accent}">
      {@html formatLabel(label)}
    </span>
  </button>

  {#if expanded && subItems.length}
    <ul class="tile-subitems" role="list">
      {#each subItems as item, i}
        <li
          class="tile-chip neo-concave elev-1"
          style="animation-delay: {i * 30}ms; --item-accent: {accent}"
        >
          <a href={item.href}>{@html formatLabel(item.label)}</a>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .tile {
    position: relative;
    background: var(--bg-base);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: box-shadow 0.2s ease;
    cursor: default;
  }

  .tile.pressing {
    box-shadow:
      inset -4px -4px 8px var(--shadow-light),
      inset  4px  4px 8px var(--shadow-dark) !important;
  }

  .tile-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 28px 20px 20px;
    background: none;
    border: none;
    width: 100%;
    cursor: pointer;
    position: relative;
    z-index: 1;
  }

  .size-hero .tile-inner {
    align-items: flex-start;
    padding: 32px 28px 24px;
  }

  .size-wide .tile-inner {
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 20px;
    padding: 0 28px;
    height: 100%;
  }

  .tile-glow {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.6;
    transition: opacity 0.3s ease;
  }

  .tile:hover .tile-glow { opacity: 1; }

  .tile-icon {
    position: relative;
    z-index: 1;
    transition: transform 0.2s ease;
  }

  .tile:hover .tile-icon { transform: scale(1.08); }

  .tile-label {
    position: relative;
    z-index: 1;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted);
    transition: color 0.2s;
  }

  .size-hero .tile-label {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0;
    text-transform: none;
    color: var(--text-accent);
  }

  .size-wide .tile-label {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--text-primary);
  }

  .tile:hover .tile-label { color: var(--text-accent); }

  .tile-subitems {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 0 20px 20px;
    position: relative;
    z-index: 1;
  }

  .size-hero .tile-subitems { padding: 0 28px 28px; }

  .tile-chip {
    border-radius: 20px;
    opacity: 0;
    animation: chipIn 0.2s ease forwards;
  }

  .tile-chip a {
    display: block;
    padding: 5px 12px;
    font-size: 12px;
    color: var(--text-muted);
    text-decoration: none;
    border-radius: 20px;
    transition: color 0.15s;
    white-space: nowrap;
  }

  .tile-chip a:hover {
    color: var(--item-accent);
  }

  @keyframes chipIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
</style>
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm run test:run -- DashboardTile
```

Expected: PASS — 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/DashboardTile.svelte src/lib/components/DashboardTile.test.js
git commit -m "feat: add DashboardTile component with 3D tilt, dynamic shadows, and size variants"
```

---

### Task 10: DashboardGrid (Bento Layout)

**Files:**
- Create: `src/lib/components/DashboardGrid.svelte`
- Create: `src/lib/components/DashboardGrid.test.js`

**Interfaces:**
- Consumes: `NAV_ITEMS` from `$lib/data/nav.js`; `DashboardTile` component
- Produces: `DashboardGrid` — no props; renders all 6 tiles in the bento CSS grid

- [ ] **Step 1: Write failing tests**

Create `src/lib/components/DashboardGrid.test.js`:

```js
import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import DashboardGrid from './DashboardGrid.svelte';

describe('DashboardGrid', () => {
  it('renders 6 tiles', () => {
    const { getAllByRole } = render(DashboardGrid);
    expect(getAllByRole('button').length).toBe(6);
  });

  it('renders DeliveryX as hero', () => {
    const { getByText } = render(DashboardGrid);
    expect(getByText('DeliveryX')).toBeTruthy();
  });

  it('renders all nav section labels', () => {
    const { getByText } = render(DashboardGrid);
    ['DeliveryX', 'My Tools', 'Work Space', 'Monitoring', 'Dashboard', 'Administration'].forEach(label => {
      expect(getByText(label)).toBeTruthy();
    });
  });
});
```

- [ ] **Step 2: Run — expect failure**

```bash
npm run test:run -- DashboardGrid
```

Expected: FAIL

- [ ] **Step 3: Create `src/lib/components/DashboardGrid.svelte`**

```svelte
<script>
  import { NAV_ITEMS } from '$lib/data/nav.js';
  import DashboardTile from './DashboardTile.svelte';
</script>

<section class="bento-grid" aria-label="Navigation launchpad">
  {#each NAV_ITEMS as item (item.id)}
    <DashboardTile
      id={item.id}
      label={item.label}
      iconName={item.iconName}
      accent={item.accent}
      accentGlow={item.accentGlow}
      subItems={item.subItems}
      size={item.size}
      gridArea={item.gridArea}
    />
  {/each}
</section>

<style>
  .bento-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(3, minmax(160px, auto));
    grid-template-areas:
      "delivery  delivery  mytools   workspace"
      "delivery  delivery  monitor   monitor"
      "dashboard admin     admin     admin";
    gap: 20px;
    padding: 20px;
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
  }

  /* Tablet */
  @media (max-width: 1023px) {
    .bento-grid {
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: auto;
      grid-template-areas:
        "delivery  delivery"
        "mytools   workspace"
        "monitor   monitor"
        "dashboard admin";
    }
  }

  /* Mobile */
  @media (max-width: 767px) {
    .bento-grid {
      grid-template-columns: 1fr;
      grid-template-areas:
        "delivery"
        "mytools"
        "workspace"
        "monitor"
        "dashboard"
        "admin";
    }
  }
</style>
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm run test:run -- DashboardGrid
```

Expected: PASS — 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/DashboardGrid.svelte src/lib/components/DashboardGrid.test.js
git commit -m "feat: add DashboardGrid bento layout with responsive grid-template-areas"
```

---

### Task 11: Layout & Dashboard Page

**Files:**
- Modify: `src/routes/+layout.svelte`
- Modify: `src/routes/+page.svelte`

**Interfaces:**
- Consumes: all stores, `OrbBackground`, `Topbar`, `Sidebar`, `DashboardGrid`
- Produces: full working page — scroll detection, mouse tracking, composed layout

- [ ] **Step 1: Replace `src/routes/+layout.svelte`**

```svelte
<script>
  import '../app.css';
  import { onMount } from 'svelte';
  import { scrolled } from '$lib/stores/theme.js';
  import { mouseX, mouseY } from '$lib/stores/mouse.js';
  import OrbBackground from '$lib/components/OrbBackground.svelte';
  import Topbar from '$lib/components/Topbar.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';

  let { children } = $props();

  onMount(() => {
    // Mouse tracking — normalized -1 to 1 relative to viewport center
    function onMouseMove(e) {
      mouseX.set((e.clientX / window.innerWidth)  * 2 - 1);
      mouseY.set((e.clientY / window.innerHeight) * 2 - 1);
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // Scroll detection via IntersectionObserver on an 80px sentinel
    const sentinel = document.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:80px;height:1px;width:1px;pointer-events:none;';
    document.body.prepend(sentinel);

    const observer = new IntersectionObserver(
      ([entry]) => scrolled.set(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinel);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      observer.disconnect();
      sentinel.remove();
    };
  });
</script>

<OrbBackground />
<Topbar />
<Sidebar />

<main class="page-content">
  {@render children()}
</main>

<style>
  :global(body) {
    overflow-x: hidden;
  }

  .page-content {
    position: relative;
    z-index: 1;
    min-height: 100vh;
    padding-top: 96px; /* topbar (64px) + 8px float + 24px gap */
  }
</style>
```

- [ ] **Step 2: Replace `src/routes/+page.svelte`**

```svelte
<script>
  import DashboardGrid from '$lib/components/DashboardGrid.svelte';
</script>

<svelte:head>
  <title>OraCodeX Nexus</title>
</svelte:head>

<DashboardGrid />
```

- [ ] **Step 3: Start dev server and verify**

```bash
npm run dev
```

Open `http://localhost:5173` in a browser. Verify:
- Deep dark `#13171f` background visible immediately (no flash)
- 3 subtle color orbs drift slowly in the background
- Floating topbar with rounded corners visible at top, showing OraCodeX logo + nav items + tagline marquee
- Bento grid of 6 neomorphic tiles visible with the correct mosaic layout (DeliveryX hero tile 2×2, wide tiles, small tiles)
- DeliveryX hero tile shows sub-item chips without clicking
- Hovering small/wide tiles triggers 3D tilt with shadow shift
- Scrolling down compresses topbar + hamburger appears
- Clicking hamburger opens sidebar panel with spring animation
- Sidebar shows all nav items; DeliveryX is expandable with sub-items

- [ ] **Step 4: Run full test suite**

```bash
npm run test:run
```

Expected: PASS — all tests pass (≥28 tests).

- [ ] **Step 5: Final commit**

```bash
git add src/routes/
git commit -m "feat: wire up layout with scroll detection, mouse tracking, and dashboard page"
```

---

## Test Coverage Summary

| File | Tests | What's tested |
|---|---|---|
| `navigation.test.js` | 4 | store initial values, toggle, set operations |
| `mouse.test.js` | 3 | initial values, normalized value acceptance |
| `tilt.test.js` | 3 | CSS var init, returns destroy, cleanup |
| `NeoPanel.test.js` | 4 | class by state, elevation class, border-radius |
| `NavItem.test.js` | 3 | renders label, hides/shows sub-items |
| `Sidebar.test.js` | 3 | hidden/visible by store, closes on backdrop click |
| `Topbar.test.js` | 4 | logo, nav links, hamburger when scrolled |
| `DashboardTile.test.js` | 5 | label, hero expands, small click, grid-area |
| `DashboardGrid.test.js` | 3 | tile count, hero label, all labels |
| **Total** | **32** | |
