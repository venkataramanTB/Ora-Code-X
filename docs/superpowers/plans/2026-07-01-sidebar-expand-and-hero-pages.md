# Sidebar Expand + DeliveryX/Smart Genesis ConveX Hero Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make clicking any sidebar parent with children reveal its children instead of navigating away, and give DeliveryX and Smart Genesis ConveX real content pages (hero text + child grid) instead of the generic "Coming Soon" placeholder.

**Architecture:** One behavioral fix in the existing recursive `NavItem.svelte` (merge two branch-rendering paths into one click-to-expand button), one new shared presentational component (`SectionHero.svelte`) reused by two new SvelteKit route pages, and one new data constant in the existing `nav.js` taglines section.

**Tech Stack:** SvelteKit 2 + Svelte 5 (runes), Vitest + @testing-library/svelte + jsdom.

## Global Constraints

- DeliveryX hero copy (exact, no "Welcome to" prefix): `A unified suite from Mythics of Oracle Cloud delivery accelerators engineered to simplify implementation, migration, conversion, and integration.`
- Smart Genesis ConveX hero copy (exact, already stored as `SMART_GENESIS_TAGLINE` in `frontend/src/lib/data/nav.js`): prefix `Welcome to `, title `Smart Genesis ConveX`, description `The next generation Oracle Cloud conversion engine that transforms enterprise data into cloud-ready intelligence through precision-driven transformation.`
- Sidebar click-to-expand applies uniformly to every node with children (not a DeliveryX-only special case). Leaf nodes (`!hasChildren && node.href`) keep navigating via `<a>` unchanged.
- No changes to the nav tree structure (no new grandchildren added anywhere) and no tooltip/hover UI — see `docs/superpowers/specs/2026-07-01-sidebar-expand-and-hero-pages-design.md` "Out of scope".
- Run tests with `cd frontend && npx vitest run <path>` (this repo's `npm test` maps to `vitest`, `npm run test:run` to `vitest run`).

---

### Task 1: Sidebar — unify branch click-to-expand

**Files:**
- Modify: `frontend/src/lib/components/NavItem.svelte:60-137` (template), `frontend/src/lib/components/NavItem.svelte:209-223` (styles)
- Test: `frontend/src/lib/components/NavItem.test.js` (full rewrite — current file uses an obsolete `{id,label,subItems,expandable}` prop shape that no longer matches the component's actual `{node, depth}` props, and fails immediately with `Cannot read properties of undefined (reading 'children')` before this task even starts)

**Interfaces:**
- Consumes: nothing new — `NavItem` still receives `{ node, depth = 0 }` exactly as today (see `NavItem.svelte:10`).
- Produces: no new exports. Behavior change only: any node where `(node.children ?? []).length > 0` now renders its own row as a `<button>` (never an `<a>`), regardless of whether `node.href` is set.

- [ ] **Step 1: Replace the stale test file with tests for the new behavior**

Overwrite `frontend/src/lib/components/NavItem.test.js` with:

```js
import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';

vi.mock('$app/stores', async () => {
	const { readable } = await import('svelte/store');
	return { page: readable({ url: new URL('http://localhost/') }) };
});

import NavItem from './NavItem.svelte';

const branchWithHref = {
	id: 'delivery',
	label: 'DeliveryX',
	href: '/delivery',
	iconName: 'Rocket',
	accent: '#00d4ff',
	children: [
		{ id: 'conversion', label: 'Smart Genesis ConveX', href: '/delivery/conversion', iconName: 'RefreshCw', children: [] }
	]
};

const leaf = {
	id: 'reports',
	label: 'Report and Analytics',
	href: '/mytools/reports',
	iconName: 'ChartBar',
	children: []
};

describe('NavItem', () => {
	it('renders a branch that also has an href as a button, not a link', () => {
		const { getByRole, queryByRole } = render(NavItem, { props: { node: branchWithHref, depth: 0 } });
		expect(getByRole('button', { name: 'DeliveryX' })).toBeTruthy();
		expect(queryByRole('link', { name: 'DeliveryX' })).toBeNull();
	});

	it('does not show children initially', () => {
		const { queryByRole } = render(NavItem, { props: { node: branchWithHref, depth: 0 } });
		expect(queryByRole('link', { name: 'Smart Genesis ConveX' })).toBeNull();
	});

	it('expands children on click without navigating', async () => {
		const { getByRole, findByRole } = render(NavItem, { props: { node: branchWithHref, depth: 0 } });
		await fireEvent.click(getByRole('button', { name: 'DeliveryX' }));
		expect(await findByRole('link', { name: 'Smart Genesis ConveX' })).toBeTruthy();
	});

	it('collapses children again on a second click', async () => {
		const { getByRole, findByRole, queryByRole } = render(NavItem, { props: { node: branchWithHref, depth: 0 } });
		const button = getByRole('button', { name: 'DeliveryX' });
		await fireEvent.click(button);
		expect(await findByRole('link', { name: 'Smart Genesis ConveX' })).toBeTruthy();
		await fireEvent.click(button);
		expect(queryByRole('link', { name: 'Smart Genesis ConveX' })).toBeNull();
	});

	it('still renders a leaf node (no children) as a plain link', () => {
		const { getByRole } = render(NavItem, { props: { node: leaf, depth: 1 } });
		expect(getByRole('link', { name: 'Report and Analytics' }).getAttribute('href')).toBe('/mytools/reports');
	});
});
```

- [ ] **Step 2: Run the tests to confirm they fail against current behavior**

Run: `cd frontend && npx vitest run src/lib/components/NavItem.test.js`
Expected: the first three tests FAIL (`DeliveryX` currently renders as an `<a>`, not a `<button>` — `getByRole('button', { name: 'DeliveryX' })` throws a `TestingLibraryElementError`). The leaf test passes already.

- [ ] **Step 3: Merge the branch-link and branch-btn rendering paths in NavItem.svelte**

Replace lines 60-137 of `frontend/src/lib/components/NavItem.svelte` (the whole `{#if !hasChildren && node.href} ... {/if}` block) with:

```svelte
{#if !hasChildren && node.href}
	<a
		class="nav-item nav-leaf"
		class:is-active={isCurrentPage}
		class:depth-1={depth === 1}
		class:depth-2={depth >= 2}
		href={node.href}
		style="--item-accent:{accent}"
		use:magnetic
	>
		{#if Icon && depth <= 1}
			<span class="nav-icon" style:color={accent}>
				<Icon size={depth === 0 ? 20 : 16} />
			</span>
		{/if}
		<span class="nav-label">{#each splitLabel(node.label) as seg}{#if seg.t === 'x'}<span class="x-char">X</span>{:else}{seg.v}{/if}{/each}</span>
		{#if isCurrentPage}
			<span class="active-dot" aria-hidden="true"></span>
		{/if}
	</a>
{:else}
	<div class="nav-branch-wrap">
		<button
			class="nav-item nav-branch-btn"
			class:is-active={isActive}
			class:depth-1={depth === 1}
			onclick={() => (expanded = !expanded)}
			aria-expanded={expanded}
			style="--item-accent:{accent}"
			use:magnetic
		>
			{#if Icon && depth <= 1}
				<span class="nav-icon" style:color={accent}>
					<Icon size={depth === 0 ? 20 : 16} />
				</span>
			{/if}
			<span class="nav-label">{#each splitLabel(node.label) as seg}{#if seg.t === 'x'}<span class="x-char">X</span>{:else}{seg.v}{/if}{/each}</span>
		</button>

		{#if hasChildren}
			<button
				class="chevron-btn"
				class:open={expanded}
				onclick={() => (expanded = !expanded)}
				aria-label="Toggle {node.label}"
			>
				<ChevronDown size={14} />
			</button>
		{/if}
	</div>

	{#if expanded && hasChildren}
		<ul class="sub-list" role="list">
			{#each node.children as child (child.id)}
				<li>
					<NavItem node={child} depth={depth + 1} />
				</li>
			{/each}
		</ul>
	{/if}
{/if}
```

This removes the `nav-branch-link` (`<a>`-wrapped) variant entirely — every node with children now renders its row as `<button class="nav-branch-btn">`, regardless of `node.href`.

- [ ] **Step 4: Remove the now-dead `.nav-branch-link` CSS rule**

In the same file's `<style>` block, delete this rule (originally around line 215-218, immediately before `.nav-branch-btn`):

```css
	.nav-branch-link {
		flex: 1;
		border-radius: 10px 0 0 10px;
	}
```

(`.nav-branch-btn` already carries the identical `flex: 1; border-radius: 10px 0 0 10px;` declaration, so no visual change.)

- [ ] **Step 5: Run the tests again to confirm they pass**

Run: `cd frontend && npx vitest run src/lib/components/NavItem.test.js`
Expected: all 5 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/components/NavItem.svelte frontend/src/lib/components/NavItem.test.js
git commit -m "fix: sidebar parent rows expand children instead of navigating"
```

---

### Task 2: `SectionHero` shared component

**Files:**
- Create: `frontend/src/lib/components/SectionHero.svelte`
- Test: `frontend/src/lib/components/SectionHero.test.js`

**Interfaces:**
- Consumes: `ICON_MAP` from `$lib/data/icons.js` (existing).
- Produces: `SectionHero.svelte` accepting props `{ tagline: {prefix?: string, title: string, description: string}, node: NavNode }` (the `NavNode` shape already defined in `frontend/src/lib/data/nav.js:1-2`, used as-is: `node.iconName`, `node.accent`, `node.children`). Tasks 3 and 4 import and render this component directly — no other API surface.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/lib/components/SectionHero.test.js`:

```js
import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import SectionHero from './SectionHero.svelte';

const tagline = {
	prefix: '',
	title: 'DeliveryX',
	description: 'A unified suite from Mythics of Oracle Cloud delivery accelerators engineered to simplify implementation, migration, conversion, and integration.'
};

const nodeWithChildren = {
	id: 'delivery',
	label: 'DeliveryX',
	href: '/delivery',
	iconName: 'Rocket',
	accent: '#00d4ff',
	children: [
		{
			id: 'conversion-group', label: 'Smart Genesis ConveX', iconName: 'RefreshCw', accent: '#00d4ff',
			children: [{ id: 'conversion', label: 'Smart Genesis ConveX', href: '/delivery/conversion', iconName: 'RefreshCw', children: [] }]
		},
		{ id: 'integration', label: 'IntegraXion', href: '/delivery/integration', iconName: 'GitMerge', accent: '#00d4ff', children: [] }
	]
};

const nodeWithoutChildren = {
	id: 'conversion',
	label: 'Smart Genesis ConveX',
	href: '/delivery/conversion',
	iconName: 'RefreshCw',
	accent: '#00d4ff',
	children: []
};

describe('SectionHero', () => {
	it('renders the exact description text', () => {
		const { getByText } = render(SectionHero, { props: { tagline, node: nodeWithChildren } });
		expect(getByText(tagline.description)).toBeTruthy();
	});

	it('renders a card grid linking directly to a child that has its own href', () => {
		const { getByRole } = render(SectionHero, { props: { tagline, node: nodeWithChildren } });
		expect(getByRole('link', { name: /IntegraXion/ }).getAttribute('href')).toBe('/delivery/integration');
	});

	it('resolves a card link to the first descendant href when a child has none of its own', () => {
		const { getByRole } = render(SectionHero, { props: { tagline, node: nodeWithChildren } });
		expect(getByRole('link', { name: /Smart Genesis ConveX/ }).getAttribute('href')).toBe('/delivery/conversion');
	});

	it('renders no card grid when the node has no children', () => {
		const { queryAllByRole } = render(SectionHero, { props: { tagline, node: nodeWithoutChildren } });
		expect(queryAllByRole('link')).toHaveLength(0);
	});
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd frontend && npx vitest run src/lib/components/SectionHero.test.js`
Expected: FAIL — `Cannot find module './SectionHero.svelte'` (file doesn't exist yet).

- [ ] **Step 3: Create the component**

Create `frontend/src/lib/components/SectionHero.svelte`:

```svelte
<script>
	import { ICON_MAP } from '$lib/data/icons.js';

	/** @type {{ tagline: {prefix?: string, title: string, description: string}, node: import('$lib/data/nav.js').NavNode }} */
	let { tagline, node } = $props();

	const Icon = $derived(node.iconName ? (ICON_MAP[node.iconName] ?? null) : null);
	const accent = $derived(node.accent ?? 'var(--accent-primary)');
	const children = $derived(node.children ?? []);

	/** @param {string} text @returns {{ t: 'text'|'x', v?: string }[]} */
	function splitLabel(text) {
		const segments = [];
		const re = /X(?=[a-z]|ion|ing|$)/g;
		let last = 0, match;
		while ((match = re.exec(text)) !== null) {
			if (match.index > last) segments.push({ t: 'text', v: text.slice(last, match.index) });
			segments.push({ t: 'x' });
			last = match.index + 1;
		}
		if (last < text.length) segments.push({ t: 'text', v: text.slice(last) });
		return segments;
	}

	/** @param {import('$lib/data/nav.js').NavNode} n @returns {string} */
	function firstHref(n) {
		if (n.href) return n.href;
		for (const child of n.children ?? []) {
			const found = firstHref(child);
			if (found) return found;
		}
		return '#';
	}
</script>

<section class="section-hero neo-convex elev-3">
	<div class="hero-glow" style="background:{accent}" aria-hidden="true"></div>

	<div class="hero-inner">
		{#if Icon}
			<span class="hero-icon" style:color={accent}>
				<Icon size={34} strokeWidth={1.5} />
			</span>
		{/if}

		<h1 class="hero-title">
			{#if tagline.prefix}<span class="hero-eyebrow">{tagline.prefix}</span>{/if}<span class="hero-name">{#each splitLabel(tagline.title) as seg}{#if seg.t === 'x'}<span class="x-char">X</span>{:else}{seg.v}{/if}{/each}</span>
		</h1>

		<p class="hero-desc">{tagline.description}</p>
	</div>
</section>

{#if children.length}
	<div class="section-grid">
		{#each children as child (child.id)}
			{@const ChildIcon = child.iconName ? ICON_MAP[child.iconName] : null}
			{@const childAccent = child.accent ?? accent}
			<a class="section-card" href={firstHref(child)} style="--acc:{childAccent}">
				<span class="sc-glow" style="background:{childAccent}"></span>

				{#if ChildIcon}
					<span class="sc-icon" style:color={childAccent}>
						<ChildIcon size={22} strokeWidth={1.5} />
					</span>
				{/if}

				<span class="sc-label">{#each splitLabel(child.label) as seg}{#if seg.t === 'x'}<span class="x-char">X</span>{:else}{seg.v}{/if}{/each}</span>

				{#if child.children?.length}
					<span class="sc-badge" style="color:{childAccent};border-color:{childAccent}33">
						{child.children.length}
					</span>
				{/if}
			</a>
		{/each}
	</div>
{/if}

<style>
	.section-hero {
		position: relative;
		border-radius: var(--radius-card, 24px);
		background: var(--bg-base);
		overflow: hidden;
		margin-bottom: 28px;
	}

	.hero-glow {
		position: absolute;
		top: -80px; left: 50%;
		transform: translateX(-50%);
		width: 280px; height: 280px;
		opacity: 0.08;
		pointer-events: none;
		filter: blur(50px);
		border-radius: 50%;
	}

	.hero-inner {
		position: relative;
		z-index: 1;
		padding: 40px 36px 36px;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 14px;
	}

	.hero-icon { display: flex; }

	.hero-title {
		font-size: 28px;
		font-weight: 800;
		color: var(--text-accent);
		letter-spacing: -0.025em;
		line-height: 1.15;
		margin: 0;
	}

	.hero-eyebrow {
		display: block;
		font-size: 12px;
		font-weight: 500;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--text-muted);
		margin-bottom: 4px;
	}

	.hero-desc {
		font-size: 14px;
		color: var(--text-muted);
		line-height: 1.65;
		margin: 0;
		max-width: 640px;
	}

	.section-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
	}

	@media (max-width: 720px) {
		.section-grid { grid-template-columns: repeat(2, 1fr); }
	}

	@media (max-width: 420px) {
		.section-grid { grid-template-columns: 1fr; }
	}

	.section-card {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 20px 12px 18px;
		border-radius: 16px;
		border: 1px solid rgba(var(--accent-primary-rgb), 0.08);
		background: var(--bg-base);
		overflow: hidden;
		text-align: center;
		text-decoration: none;
		transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
		box-shadow:
			-4px -4px 10px var(--shadow-light),
			 4px  4px 10px var(--shadow-dark);
	}

	.section-card:hover {
		border-color: color-mix(in srgb, var(--acc) 40%, transparent);
		box-shadow:
			-4px -4px 10px var(--shadow-light),
			 4px  4px 10px var(--shadow-dark),
			0 0 20px color-mix(in srgb, var(--acc) 18%, transparent);
		transform: translateY(-3px);
	}

	.sc-glow {
		position: absolute;
		inset: 0;
		opacity: 0;
		transition: opacity 0.25s;
		pointer-events: none;
		filter: blur(30px);
	}

	.section-card:hover .sc-glow { opacity: 0.07; }

	.sc-icon {
		display: flex;
		align-items: center;
		position: relative;
		z-index: 1;
		transition: filter 0.2s, transform 0.2s;
	}

	.section-card:hover .sc-icon {
		filter: drop-shadow(0 0 8px var(--acc));
		transform: scale(1.12);
	}

	.sc-label {
		font-size: 12.5px;
		font-weight: 600;
		color: var(--text-muted);
		position: relative;
		z-index: 1;
		transition: color 0.2s;
	}

	.section-card:hover .sc-label { color: var(--text-accent); }

	.sc-badge {
		font-size: 9.5px;
		font-weight: 700;
		padding: 1px 7px;
		border-radius: 6px;
		border: 1px solid;
		letter-spacing: 0.05em;
		position: relative;
		z-index: 1;
		opacity: 0.75;
	}
</style>
```

- [ ] **Step 4: Run the tests again to confirm they pass**

Run: `cd frontend && npx vitest run src/lib/components/SectionHero.test.js`
Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/components/SectionHero.svelte frontend/src/lib/components/SectionHero.test.js
git commit -m "feat: add SectionHero component for section landing pages"
```

---

### Task 3: `/delivery` page with DeliveryX hero + child grid

**Files:**
- Modify: `frontend/src/lib/data/nav.js` (add `DELIVERY_TAGLINE` constant next to `SMART_GENESIS_TAGLINE` at the end of the file, around line 246)
- Create: `frontend/src/routes/delivery/+page.svelte`
- Test: `frontend/src/routes/delivery/page.test.js`

**Interfaces:**
- Consumes: `SectionHero` from Task 2 (`props: { tagline, node }`), `findNodeByPath` and `NAV_ITEMS` from `frontend/src/lib/data/nav.js:217-238` (existing, unchanged), `Breadcrumb` from `frontend/src/lib/components/Breadcrumb.svelte` (existing, unchanged, `props: { items }`).
- Produces: `DELIVERY_TAGLINE` exported constant, shape `{ prefix: string, title: string, description: string }`, for any future consumer.

- [ ] **Step 1: Add the DeliveryX tagline constant**

In `frontend/src/lib/data/nav.js`, immediately after the existing `SMART_GENESIS_TAGLINE` export (end of file, currently lines 247-251), add:

```js
export const DELIVERY_TAGLINE = {
	prefix:      '',
	title:       'DeliveryX',
	description: 'A unified suite from Mythics of Oracle Cloud delivery accelerators engineered to simplify implementation, migration, conversion, and integration.',
};
```

- [ ] **Step 2: Write the failing test for the new page**

Create `frontend/src/routes/delivery/page.test.js`:

```js
import { render } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';

vi.mock('$app/stores', async () => {
	const { readable } = await import('svelte/store');
	return { page: readable({ url: new URL('http://localhost/delivery') }) };
});

import Page from './+page.svelte';

describe('/delivery page', () => {
	it('renders the DeliveryX hero description exactly', () => {
		const { getByText } = render(Page);
		expect(getByText(
			'A unified suite from Mythics of Oracle Cloud delivery accelerators engineered to simplify implementation, migration, conversion, and integration.'
		)).toBeTruthy();
	});

	it('renders a card for each of DeliveryX\'s children', () => {
		const { getByRole } = render(Page);
		expect(getByRole('link', { name: /IntegraXion/ })).toBeTruthy();
		expect(getByRole('link', { name: /Cross ValidaXion/ })).toBeTruthy();
		expect(getByRole('link', { name: /Cloud ActionX/ })).toBeTruthy();
	});

	it('renders the breadcrumb trail', () => {
		const { getByRole } = render(Page);
		expect(getByRole('navigation', { name: 'Breadcrumb' })).toBeTruthy();
	});
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `cd frontend && npx vitest run src/routes/delivery/page.test.js`
Expected: FAIL — `Cannot find module './+page.svelte'` (route file doesn't exist yet).

- [ ] **Step 4: Create the page**

Create `frontend/src/routes/delivery/+page.svelte`:

```svelte
<script>
	import { page } from '$app/stores';
	import { findNodeByPath, DELIVERY_TAGLINE } from '$lib/data/nav.js';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import SectionHero from '$lib/components/SectionHero.svelte';

	const result = $derived(findNodeByPath($page.url.pathname));
	const crumbs = $derived(result?.crumbs ?? []);
	const node = $derived(result?.node);
</script>

<svelte:head>
	<title>DeliveryX · OraBridgeX Nexus</title>
</svelte:head>

<div class="page-shell">
	<Breadcrumb items={crumbs} />
	{#if node}
		<SectionHero tagline={DELIVERY_TAGLINE} {node} />
	{/if}
</div>

<style>
	.page-shell {
		padding: 32px clamp(16px, 3vw, 48px);
		max-width: 1100px;
		margin: 0 auto;
	}
</style>
```

- [ ] **Step 5: Run the tests again to confirm they pass**

Run: `cd frontend && npx vitest run src/routes/delivery/page.test.js`
Expected: all 3 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/data/nav.js frontend/src/routes/delivery/+page.svelte frontend/src/routes/delivery/page.test.js
git commit -m "feat: add DeliveryX landing page with hero and child grid"
```

---

### Task 4: `/delivery/conversion` page with Smart Genesis ConveX hero

**Files:**
- Create: `frontend/src/routes/delivery/conversion/+page.svelte`
- Test: `frontend/src/routes/delivery/conversion/page.test.js`

**Interfaces:**
- Consumes: `SectionHero` from Task 2, `SMART_GENESIS_TAGLINE` (existing export, `frontend/src/lib/data/nav.js:247-251`, unchanged), `findNodeByPath` (existing), `Breadcrumb` (existing).
- Produces: nothing new — terminal route page.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/routes/delivery/conversion/page.test.js`:

```js
import { render } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';

vi.mock('$app/stores', async () => {
	const { readable } = await import('svelte/store');
	return { page: readable({ url: new URL('http://localhost/delivery/conversion') }) };
});

import Page from './+page.svelte';

describe('/delivery/conversion page', () => {
	it('renders the Smart Genesis ConveX hero text exactly', () => {
		const { getByText } = render(Page);
		expect(getByText(
			'The next generation Oracle Cloud conversion engine that transforms enterprise data into cloud-ready intelligence through precision-driven transformation.'
		)).toBeTruthy();
	});

	it('renders no child card grid', () => {
		const { queryAllByRole } = render(Page);
		expect(queryAllByRole('link', { name: /Smart Genesis ConveX/ })).toHaveLength(0);
	});

	it('renders the breadcrumb trail back to DeliveryX', () => {
		const { getByRole } = render(Page);
		expect(getByRole('link', { name: 'DeliveryX' })).toBeTruthy();
	});
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd frontend && npx vitest run src/routes/delivery/conversion/page.test.js`
Expected: FAIL — `Cannot find module './+page.svelte'` (route file doesn't exist yet).

- [ ] **Step 3: Create the page**

Create `frontend/src/routes/delivery/conversion/+page.svelte`:

```svelte
<script>
	import { page } from '$app/stores';
	import { findNodeByPath, SMART_GENESIS_TAGLINE } from '$lib/data/nav.js';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import SectionHero from '$lib/components/SectionHero.svelte';

	const result = $derived(findNodeByPath($page.url.pathname));
	const crumbs = $derived(result?.crumbs ?? []);
	const node = $derived(result?.node);
</script>

<svelte:head>
	<title>Smart Genesis ConveX · OraBridgeX Nexus</title>
</svelte:head>

<div class="page-shell">
	<Breadcrumb items={crumbs} />
	{#if node}
		<SectionHero tagline={SMART_GENESIS_TAGLINE} {node} />
	{/if}
</div>

<style>
	.page-shell {
		padding: 32px clamp(16px, 3vw, 48px);
		max-width: 1100px;
		margin: 0 auto;
	}
</style>
```

- [ ] **Step 4: Run the tests again to confirm they pass**

Run: `cd frontend && npx vitest run src/routes/delivery/conversion/page.test.js`
Expected: all 3 tests PASS.

- [ ] **Step 5: Run the full test suite as a final sanity check**

Run: `cd frontend && npx vitest run`
Expected: the four test files touched/added in this plan (`NavItem.test.js`, `SectionHero.test.js`, `src/routes/delivery/page.test.js`, `src/routes/delivery/conversion/page.test.js`) all PASS. Note: `Sidebar.test.js` was already failing before this plan (pre-existing `$app/stores`/`$page` environment issue unrelated to these changes — confirmed by running it in isolation prior to this plan) and is out of scope to fix here.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/routes/delivery/conversion/+page.svelte frontend/src/routes/delivery/conversion/page.test.js
git commit -m "feat: add Smart Genesis ConveX landing page with hero text"
```
