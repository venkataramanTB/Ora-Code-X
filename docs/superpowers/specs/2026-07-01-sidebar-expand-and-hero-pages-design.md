# Sidebar Parent-Click Expand + DeliveryX/Smart Genesis ConveX Hero Pages

## Problem

1. In the sidebar (`NavItem.svelte`), a node that has both an `href` and `children` (e.g. DeliveryX, IntegraXion, Cross ValidaXion, Cloud ActionX) renders as a clickable `<a>` — clicking the row navigates to the item's own page instead of revealing its children. Only the small chevron button on the right toggles the child list. Nodes with children but no `href` (e.g. the "Smart Genesis ConveX" group, "DataXMining" group) already toggle correctly on row click, because they render as a `<button>`.
2. `/delivery` and `/delivery/conversion` have no dedicated route files, so they fall through to the catch-all `src/routes/[...slug]/+page.svelte`, which renders a generic "Coming Soon" card. These two routes are reachable today via breadcrumb links (`Breadcrumb.svelte` links each crumb to its `node.href`). The nav data already has an unused `SMART_GENESIS_TAGLINE` constant in `nav.js` intended for the conversion page; there is no equivalent constant for DeliveryX yet.

## Design

### 1. Sidebar: uniform click-to-expand

In `frontend/src/lib/components/NavItem.svelte`, merge the two branch-rendering paths (`nav-branch-link` vs `nav-branch-btn`) into a single button-based branch used whenever `hasChildren` is true, regardless of whether the node also has an `href`:

- Clicking anywhere on the row toggles `expanded`.
- The row no longer navigates for nodes with children (the existing `href` is retained in the data for `findNodeByPath`/breadcrumbs/active-state, just not used as a navigation target from this row).
- The separate chevron button remains, doing the same toggle (harmless redundancy, keeps the existing rotate-arrow affordance).
- Leaf nodes (`!hasChildren && node.href`) are unaffected — they keep navigating via `<a>` as today.

This is a uniform behavior change across the whole tree, not a special case for DeliveryX.

### 2. Nav data: add a DeliveryX tagline

In `frontend/src/lib/data/nav.js`, add a new exported constant alongside the existing `SMART_GENESIS_TAGLINE`:

```js
export const DELIVERY_TAGLINE = {
	prefix:      '',
	title:       'DeliveryX',
	description: 'A unified suite from Mythics of Oracle Cloud delivery accelerators engineered to simplify implementation, migration, conversion, and integration.',
};
```

`SMART_GENESIS_TAGLINE` (already present, currently unused) becomes wired in as-is:

```js
export const SMART_GENESIS_TAGLINE = {
	prefix:      'Welcome to ',
	title:       'Smart Genesis ConveX',
	description: 'The next generation Oracle Cloud conversion engine that transforms enterprise data into cloud-ready intelligence through precision-driven transformation.',
};
```

### 3. Shared `SectionHero` component

New component `frontend/src/lib/components/SectionHero.svelte`:

- Props: `{ tagline: {prefix, title, description}, accent, iconName, children }` where `children` is the `NavNode[]` of the section's own children (may be empty).
- Renders a hero block: icon, `{prefix}{title}` with X-letters highlighted (reusing the existing `splitLabel`/`x-char` pattern already used in `NavItem.svelte`, `+page.svelte`, and `[...slug]/+page.svelte`), and the description paragraph.
- If `children.length > 0`, renders a card grid below the hero, visually matching the homepage `.feature-grid` / `.feature-card` styling in `frontend/src/routes/+page.svelte` (icon, accent glow, label, child-count badge when a card's own node has children). Each card links to that child's own page — using `child.href` if present, else resolving to the first descendant `href` found via depth-first search (needed for `conversion-group` and `mining-group`, which have no `href` of their own).
- If `children.length === 0`, only the hero renders (no grid section at all).

### 4. New route pages

- `frontend/src/routes/delivery/+page.svelte`: uses `DELIVERY_TAGLINE`, accent `#00d4ff`, iconName `Rocket`, and passes the `delivery` node's `children` (6 groups) into `SectionHero`.
- `frontend/src/routes/delivery/conversion/+page.svelte`: uses `SMART_GENESIS_TAGLINE`, accent `#00d4ff`, iconName `RefreshCw`, and passes an empty children array into `SectionHero` (renders hero only, no grid).

Both pages take priority over the catch-all `[...slug]` route per SvelteKit's routing precedence (static/named routes win over the rest-parameter route), so visiting these two paths no longer shows "Coming Soon".

## Out of scope

- No changes to the nav tree structure itself (no new grandchildren added under Smart Genesis ConveX).
- No tooltip/hover-preview UI — the description only surfaces on the dedicated content pages, not in the sidebar itself.
- No changes to how the homepage feature-grid cards behave (`openSection` continues to expand+open the sidebar for items with children, rather than navigating).
- Dedicated pages are only being built for these two specific items (DeliveryX, Smart Genesis ConveX) — other placeholder routes keep using the generic Coming Soon fallback.

## Testing

- Existing `Sidebar.test.js` coverage (open/close/backdrop) should keep passing.
- Add/extend a test for `NavItem.svelte` confirming that clicking a branch row with both `href` and children toggles `expanded` without triggering navigation.
- Manual check in the browser: expand DeliveryX in the sidebar, confirm children show; visit `/delivery` directly and via breadcrumb, confirm hero + 6-card grid render; visit `/delivery/conversion`, confirm hero-only renders with the exact provided description text.
