# Navigation Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the full enterprise navigation hierarchy (6 sections, 3 levels deep, ~40 routes) into the sidebar, routing system, and breadcrumbs — without breaking existing functionality.

**Architecture:** All routes continue to be served by the existing `[...slug]/+page.svelte` catch-all; no individual route files are created. Navigation data is centralised in `nav.js` with a new recursive `children` tree alongside the existing flat `subItems` used by `DashboardTile`. `NavItem.svelte` is rewritten as a recursive component using `svelte:self`.

**Tech Stack:** SvelteKit 2, Svelte 5 (runes), lucide-svelte, TypeScript via `lang="ts"` in Svelte files.

## Global Constraints

- No existing functionality removed
- No new route files — `[...slug]/+page.svelte` is the universal handler
- `subItems` shape `{label, href}[]` preserved on top-level NAV_ITEMS for DashboardTile chips
- `lang="ts"` on all modified/new `.svelte` files
- All icons must exist in the installed `lucide-svelte` (verified: `ChartBar`, `CircleCheck`, `CircleX`, `PackageX`, `SquareCheck`, `CircleAlert`, `ArrowDownToLine`, `ArrowUpToLine`, `Code`, etc.)
- No unused imports, no dead code
- `svelte-check` must pass with 0 errors after each task

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/data/nav.js` | **Rewrite** | 3-level nav tree + subItems for DashboardTile |
| `src/lib/data/icons.js` | **Extend** | ~25 new lucide icons added to ICON_MAP |
| `src/lib/components/NavItem.svelte` | **Rewrite** | Recursive tree, active detection, auto-expand |
| `src/lib/components/Sidebar.svelte` | **Update** | Pass `node` object to NavItem |
| `src/lib/components/Breadcrumb.svelte` | **Create** | Reusable breadcrumb from array of `{label,href}` |
| `src/routes/[...slug]/+page.svelte` | **Update** | 3-level route resolution + Breadcrumb component |

---

### Task 1: Extend icons.js

**Files:**
- Modify: `frontend/src/lib/data/icons.js`

**Interfaces:**
- Produces: Extended `ICON_MAP` with new keys used by nav.js children

- [ ] **Step 1: Replace icons.js with extended version**

```js
import {
	Rocket, Wrench, LayoutDashboard, Activity,
	PieChart, Shield, Menu, X, Search, User,
	ChevronRight, ChevronDown, Palette, Check,
	Moon, Sun,
	// Navigation tree icons
	RefreshCw, GitMerge, ArrowDownToLine, ArrowUpToLine,
	ChartBar, FileCode, CircleCheck, ListChecks, SquareCheck,
	Database, Zap, Trash2, CircleX, PackageX, ClipboardX,
	Play, RotateCcw, Code, FolderOpen, FileSpreadsheet, FileText,
	MapPin, FileSearch, CalendarClock, Lock, EyeOff,
	History, ScrollText, CircleAlert, Network, Server, BookOpen, Cloud,
} from 'lucide-svelte';

export const ICON_MAP = {
	Rocket, Wrench, LayoutDashboard, Activity,
	PieChart, Shield, Menu, X, Search, User,
	ChevronRight, ChevronDown, Palette, Check,
	Moon, Sun,
	RefreshCw, GitMerge, ArrowDownToLine, ArrowUpToLine,
	ChartBar, FileCode, CircleCheck, ListChecks, SquareCheck,
	Database, Zap, Trash2, CircleX, PackageX, ClipboardX,
	Play, RotateCcw, Code, FolderOpen, FileSpreadsheet, FileText,
	MapPin, FileSearch, CalendarClock, Lock, EyeOff,
	History, ScrollText, CircleAlert, Network, Server, BookOpen, Cloud,
};
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npm run build`
Expected: `✓ built` with 0 errors

---

### Task 2: Rewrite nav.js with 3-level hierarchy

**Files:**
- Modify: `frontend/src/lib/data/nav.js`

**Interfaces:**
- Consumes: Nothing (pure data)
- Produces: `NAV_ITEMS` (array), `TAGLINE` (object), `findNodeByPath(pathname)` (function returning `{crumbs, node}`)

- [ ] **Step 1: Write new nav.js**

```js
/**
 * @typedef {{ id: string, label: string, href?: string, iconName?: string, accent?: string, children?: NavNode[] }} NavNode
 * @typedef {{ id: string, label: string, href: string, iconName: string, accent: string, accentGlow: string, gridArea: string, size: 'hero'|'wide'|'small', subItems: {label:string,href:string}[], children: NavNode[] }} NavItem
 */

/** @type {NavItem[]} */
export const NAV_ITEMS = [
	{
		id: 'delivery',
		label: 'DeliveryX',
		href: '/delivery',
		iconName: 'Rocket',
		accent: '#00d4ff',
		accentGlow: 'rgba(0,212,255,0.15)',
		gridArea: 'delivery',
		size: 'hero',
		subItems: [
			{ label: 'Oracle Cloud ConverXion', href: '/delivery/conversion' },
			{ label: 'IntegraXion',             href: '/delivery/integration' },
			{ label: 'Cross ValidaXion',        href: '/delivery/validation'  },
			{ label: 'DataXMining',             href: '/delivery/mining'      },
			{ label: 'Cloud ActionX',           href: '/delivery/actions'     },
		],
		children: [
			{
				id: 'conversion-group',
				label: 'Oracle Cloud ConverXion',
				iconName: 'RefreshCw',
				accent: '#00d4ff',
				children: [
					{ id: 'conversion', label: 'Oracle Cloud Conversion', href: '/delivery/conversion', iconName: 'RefreshCw' },
				],
			},
			{
				id: 'integration',
				label: 'IntegraXion',
				href: '/delivery/integration',
				iconName: 'GitMerge',
				accent: '#00d4ff',
				children: [
					{ id: 'inbound',  label: 'Cloud Inbound Integration',  href: '/delivery/integration/inbound',  iconName: 'ArrowDownToLine' },
					{ id: 'outbound', label: 'Cloud Outbound Integration', href: '/delivery/integration/outbound', iconName: 'ArrowUpToLine'   },
					{ id: 'pbcs',     label: 'Oracle PBCS Integration',    href: '/delivery/integration/pbcs',     iconName: 'ChartBar'        },
					{ id: 'edi',      label: 'EDI Integration',            href: '/delivery/integration/edi',      iconName: 'FileCode'        },
				],
			},
			{
				id: 'validation',
				label: 'Cross ValidaXion',
				href: '/delivery/validation',
				iconName: 'CircleCheck',
				accent: '#00d4ff',
				children: [
					{ id: 'pre',  label: 'Pre Load Validation',  href: '/delivery/validation/pre',  iconName: 'ListChecks'  },
					{ id: 'post', label: 'Post Load Validation', href: '/delivery/validation/post', iconName: 'SquareCheck' },
				],
			},
			{
				id: 'mining-group',
				label: 'DataXMining',
				iconName: 'Database',
				accent: '#00d4ff',
				children: [
					{ id: 'mining', label: 'Data Mining', href: '/delivery/mining', iconName: 'Database' },
				],
			},
			{
				id: 'actions',
				label: 'Cloud ActionX',
				href: '/delivery/actions',
				iconName: 'Zap',
				accent: '#00d4ff',
				children: [
					{ id: 'delete-po',       label: 'Delete Purchase Orders',  href: '/delivery/actions/delete-po',       iconName: 'Trash2'      },
					{ id: 'cancel-ap',       label: 'Cancel AP Invoices',      href: '/delivery/actions/cancel-ap',       iconName: 'CircleX'     },
					{ id: 'cancel-to',       label: 'Cancel Transfer Orders',  href: '/delivery/actions/cancel-to',       iconName: 'PackageX'    },
					{ id: 'cancel-receipts', label: 'Cancel Receipts',         href: '/delivery/actions/cancel-receipts', iconName: 'ClipboardX'  },
					{ id: 'delete-req',      label: 'Delete Requisitions',     href: '/delivery/actions/delete-req',      iconName: 'Trash2'      },
					{ id: 'update-item',     label: 'Update Item Status',      href: '/delivery/actions/update-item',     iconName: 'RefreshCw'   },
					{ id: 'submit-ess',      label: 'Submit ESS Jobs',         href: '/delivery/actions/submit-ess',      iconName: 'Play'        },
					{ id: 'reprocess',       label: 'Reprocess Transactions',  href: '/delivery/actions/reprocess',       iconName: 'RotateCcw'   },
					{ id: 'rest-apis',       label: 'Custom REST APIs',        href: '/delivery/actions/rest-apis',       iconName: 'Code'        },
				],
			},
		],
	},
	{
		id: 'mytools',
		label: 'My Tools',
		href: '/mytools',
		iconName: 'Wrench',
		accent: '#f5a623',
		accentGlow: 'rgba(245,166,35,0.15)',
		gridArea: 'mytools',
		size: 'small',
		subItems: [
			{ label: 'Report & Analytics', href: '/mytools/reports'   },
			{ label: 'Cloud Templates',    href: '/mytools/templates' },
			{ label: 'Mappings',           href: '/mytools/mappings'  },
			{ label: 'File Parser',        href: '/mytools/parser'    },
			{ label: 'Scheduler',          href: '/mytools/scheduler' },
			{ label: 'Encryptography',     href: '/mytools/encrypt'   },
			{ label: 'Data Masking',       href: '/mytools/masking'   },
		],
		children: [
			{ id: 'reports',   label: 'Report and Analytics', href: '/mytools/reports',   iconName: 'ChartBar',      accent: '#f5a623', children: [] },
			{
				id: 'templates',
				label: 'Cloud Templates',
				href: '/mytools/templates',
				iconName: 'FolderOpen',
				accent: '#f5a623',
				children: [
					{ id: 'fbdi', label: 'FBDI Templates', href: '/mytools/templates/fbdi', iconName: 'FileSpreadsheet' },
					{ id: 'hdl',  label: 'HDL Templates',  href: '/mytools/templates/hdl',  iconName: 'FileText'        },
				],
			},
			{ id: 'mappings',  label: 'Mappings',        href: '/mytools/mappings',  iconName: 'MapPin',      accent: '#f5a623', children: [] },
			{ id: 'parser',    label: 'File Parser',     href: '/mytools/parser',    iconName: 'FileSearch',  accent: '#f5a623', children: [] },
			{ id: 'scheduler', label: 'Scheduler',       href: '/mytools/scheduler', iconName: 'CalendarClock', accent: '#f5a623', children: [] },
			{ id: 'encrypt',   label: 'Encryptography',  href: '/mytools/encrypt',   iconName: 'Lock',        accent: '#f5a623', children: [] },
			{ id: 'masking',   label: 'Data Masking',    href: '/mytools/masking',   iconName: 'EyeOff',      accent: '#f5a623', children: [] },
		],
	},
	{
		id: 'workspace',
		label: 'Work Space',
		href: '/workspace',
		iconName: 'LayoutDashboard',
		accent: '#ff4d6d',
		accentGlow: 'rgba(255,77,109,0.15)',
		gridArea: 'workspace',
		size: 'small',
		subItems: [],
		children: [],
	},
	{
		id: 'monitoring',
		label: 'Monitoring',
		href: '/monitoring',
		iconName: 'Activity',
		accent: '#00e676',
		accentGlow: 'rgba(0,230,118,0.15)',
		gridArea: 'monitor',
		size: 'wide',
		subItems: [
			{ label: 'Running Jobs', href: '/monitoring/running' },
			{ label: 'Job History',  href: '/monitoring/history' },
			{ label: 'Logs',         href: '/monitoring/logs'    },
			{ label: 'Error Queue',  href: '/monitoring/errors'  },
		],
		children: [
			{ id: 'running', label: 'Running Jobs', href: '/monitoring/running', iconName: 'Play',        accent: '#00e676', children: [] },
			{ id: 'history', label: 'Job History',  href: '/monitoring/history', iconName: 'History',     accent: '#00e676', children: [] },
			{ id: 'logs',    label: 'Logs',         href: '/monitoring/logs',    iconName: 'ScrollText',  accent: '#00e676', children: [] },
			{ id: 'errors',  label: 'Error Queue',  href: '/monitoring/errors',  iconName: 'CircleAlert', accent: '#00e676', children: [] },
		],
	},
	{
		id: 'dashboard',
		label: 'Dashboard',
		href: '/dashboard',
		iconName: 'PieChart',
		accent: '#4fc3f7',
		accentGlow: 'rgba(79,195,247,0.15)',
		gridArea: 'dashboard',
		size: 'small',
		subItems: [],
		children: [],
	},
	{
		id: 'admin',
		label: 'Administration',
		href: '/admin',
		iconName: 'Shield',
		accent: '#b39ddb',
		accentGlow: 'rgba(179,157,219,0.15)',
		gridArea: 'admin',
		size: 'wide',
		subItems: [
			{ label: 'Connections', href: '/admin/connections' },
			{ label: 'Audit Logs',  href: '/admin/audit'       },
			{ label: 'License',     href: '/admin/license'     },
		],
		children: [
			{
				id: 'connections',
				label: 'Connections',
				href: '/admin/connections',
				iconName: 'Network',
				accent: '#b39ddb',
				children: [
					{ id: 'database', label: 'Database Connections', href: '/admin/connections/database', iconName: 'Database' },
					{ id: 'saas',     label: 'Oracle Cloud SaaS',    href: '/admin/connections/saas',     iconName: 'Cloud'    },
					{ id: 'sftp',     label: 'SFTP Server',          href: '/admin/connections/sftp',     iconName: 'Server'   },
				],
			},
			{ id: 'audit',   label: 'Audit Logs', href: '/admin/audit',   iconName: 'BookOpen', accent: '#b39ddb', children: [] },
			{ id: 'license', label: 'License',    href: '/admin/license', iconName: 'FileText', accent: '#b39ddb', children: [] },
		],
	},
];

/**
 * Walk the nav tree and return breadcrumb trail + matched leaf for a given pathname.
 * @param {string} pathname
 * @returns {{ crumbs: {label:string, href:string}[], node: NavNode|null }}
 */
export function findNodeByPath(pathname) {
	/** @param {NavNode[]} nodes @param {{label:string,href:string}[]} trail */
	function walk(nodes, trail) {
		for (const node of nodes) {
			const next = [...trail];
			if (node.href) next.push({ label: node.label, href: node.href });
			if (node.href === pathname) return { crumbs: next, node };
			if (node.children?.length) {
				const result = walk(node.children, next);
				if (result) return result;
			}
		}
		return null;
	}
	for (const item of NAV_ITEMS) {
		const trail = [{ label: item.label, href: item.href }];
		if (item.href === pathname) return { crumbs: trail, node: item };
		const result = walk(item.children ?? [], trail);
		if (result) return result;
	}
	return { crumbs: [], node: null };
}

export const TAGLINE = {
	prefix:    'Welcome to ',
	brand:     'OraCodeX Nexus',
	separator: ' — The Intelligent Oracle Cloud Delivery Platform | ',
	keywords: [
		{ word: 'Extract',   color: '#ff4d6d' },
		{ word: 'Convert',   color: '#00d4ff' },
		{ word: 'Integrate', color: '#00e676' },
		{ word: 'Actions',   color: '#ff9800' },
		{ word: 'Validate',  color: '#b39ddb' },
		{ word: 'Deliver',   color: '#4fc3f7' },
	],
};
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npm run build`
Expected: `✓ built` with 0 errors

---

### Task 3: Rewrite NavItem.svelte (recursive, active state, auto-expand)

**Files:**
- Modify: `frontend/src/lib/components/NavItem.svelte`

**Interfaces:**
- Consumes: `ICON_MAP` from icons.js, `$page` from `$app/stores`
- Produces: Recursive sidebar tree nodes with active highlighting

- [ ] **Step 1: Rewrite NavItem.svelte**

```svelte
<script lang="ts">
	import { page } from '$app/stores';
	import { ICON_MAP } from '$lib/data/icons.js';
	import { magnetic } from '$lib/actions/magnetic.js';

	interface NavNode {
		id: string;
		label: string;
		href?: string;
		iconName?: string;
		accent?: string;
		children?: NavNode[];
	}

	let { node, depth = 0 }: { node: NavNode; depth?: number } = $props();

	const ChevronDown = ICON_MAP['ChevronDown'];
	const Icon = $derived(node.iconName ? (ICON_MAP[node.iconName] ?? null) : null);

	const accent = $derived(node.accent ?? 'var(--accent-primary)');
	const hasChildren = $derived((node.children ?? []).length > 0);

	const pathname = $derived($page.url.pathname);
	// Exact match OR child of this path
	const isCurrentPage = $derived(!!node.href && pathname === node.href);
	const isAncestor    = $derived(!!node.href && pathname.startsWith(node.href + '/'));
	const isActive      = $derived(isCurrentPage || isAncestor);

	let expanded = $state(false);

	// Auto-expand when active path falls inside this branch
	$effect(() => {
		if (isActive && hasChildren) expanded = true;
	});

	function formatLabel(text: string): string {
		return text.replace(/X(?=[a-z]|ion|ing|$)/g, '<span class="x-char">X</span>');
	}
</script>

{#if !hasChildren && node.href}
	<!-- Leaf node -->
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
		<span class="nav-label">{@html formatLabel(node.label)}</span>
		{#if isCurrentPage}
			<span class="active-dot" aria-hidden="true"></span>
		{/if}
	</a>
{:else}
	<!-- Branch node -->
	<div class="nav-branch-wrap">
		{#if node.href}
			<a
				class="nav-item nav-branch-link"
				class:is-active={isActive}
				class:depth-1={depth === 1}
				href={node.href}
				style="--item-accent:{accent}"
			>
				{#if Icon && depth <= 1}
					<span class="nav-icon" style:color={accent}>
						<Icon size={depth === 0 ? 20 : 16} />
					</span>
				{/if}
				<span class="nav-label">{@html formatLabel(node.label)}</span>
			</a>
		{:else}
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
				<span class="nav-label">{@html formatLabel(node.label)}</span>
			</button>
		{/if}

		{#if hasChildren}
			<button
				class="chevron-btn"
				class:open={expanded}
				onclick={() => (expanded = !expanded)}
				aria-label="Toggle {node.label}"
				aria-expanded={expanded}
			>
				<ChevronDown size={14} />
			</button>
		{/if}
	</div>

	{#if expanded && hasChildren}
		<ul class="sub-list" role="list">
			{#each node.children! as child (child.id)}
				<li>
					<svelte:self node={child} depth={depth + 1} />
				</li>
			{/each}
		</ul>
	{/if}
{/if}

<style>
	/* ── Shared nav-item base ── */
	.nav-item {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		padding: 8px 14px;
		border-radius: 10px;
		text-align: left;
		font-size: 13.5px;
		font-weight: 500;
		color: var(--text-primary);
		text-decoration: none;
		border: none;
		background: none;
		cursor: pointer;
		transition: background 0.14s, color 0.14s;
		position: relative;
	}

	.nav-item::before {
		content: '';
		position: absolute;
		left: 0; top: 50%;
		transform: translateY(-50%) scaleY(0);
		width: 3px; height: 55%;
		background: var(--item-accent);
		border-radius: 0 3px 3px 0;
		transition: transform 0.18s ease;
	}

	.nav-item:hover,
	.nav-item.is-active {
		background: rgba(255, 255, 255, 0.028);
		color: var(--text-accent);
	}

	.nav-item.is-active::before {
		transform: translateY(-50%) scaleY(1);
	}

	/* depth-1: slightly smaller, more indented */
	.nav-item.depth-1 {
		font-size: 13px;
		padding: 7px 12px;
	}

	.nav-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		transition: filter 0.18s;
	}

	.nav-item:hover .nav-icon,
	.nav-item.is-active .nav-icon {
		filter: drop-shadow(0 0 5px var(--item-accent));
	}

	.nav-label { flex: 1; }

	/* Active dot for exact-match leaf */
	.active-dot {
		width: 5px; height: 5px;
		border-radius: 50%;
		background: var(--item-accent);
		flex-shrink: 0;
		opacity: 0.8;
	}

	/* ── Branch row (link + chevron button side by side) ── */
	.nav-branch-wrap {
		display: flex;
		align-items: stretch;
		border-radius: 10px;
		overflow: visible;
	}

	.nav-branch-link,
	.nav-branch-btn {
		flex: 1;
		border-radius: 10px 0 0 10px;
	}

	.chevron-btn {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-muted);
		border-radius: 0 10px 10px 0;
		transition: background 0.14s, color 0.14s, transform 0.22s ease;
	}

	.chevron-btn:hover {
		background: rgba(255, 255, 255, 0.04);
		color: var(--text-accent);
	}

	.chevron-btn.open {
		transform: rotate(-180deg);
	}

	/* Branch btn (no href): full width, round all corners */
	.nav-branch-btn {
		border-radius: 10px;
	}

	/* When branch-btn exists alone, the chevron shares the row */
	.nav-branch-wrap:has(.nav-branch-btn) .chevron-btn {
		border-radius: 0 10px 10px 0;
	}
	.nav-branch-wrap:has(.nav-branch-btn) .nav-branch-btn {
		border-radius: 10px 0 0 10px;
	}

	/* ── Sub-list (children) ── */
	.sub-list {
		list-style: none;
		padding: 2px 0 2px 18px;
		display: flex;
		flex-direction: column;
		gap: 1px;
		border-left: 1px solid rgba(255, 255, 255, 0.05);
		margin-left: 20px;
	}

	/* depth-2 leaves: no icon, smaller */
	:global(.sub-list .sub-list .nav-item) {
		font-size: 12.5px;
		padding: 6px 10px;
		color: var(--text-muted);
	}

	:global(.sub-list .sub-list .nav-item:hover),
	:global(.sub-list .sub-list .nav-item.is-active) {
		color: var(--item-accent);
		background: rgba(255, 255, 255, 0.02);
	}
</style>
```

- [ ] **Step 2: Run svelte-check**

Run: `cd frontend && npx svelte-check 2>&1 | tail -5`
Expected: `0 ERRORS 0 WARNINGS`

---

### Task 4: Update Sidebar.svelte to use node-based NavItem

**Files:**
- Modify: `frontend/src/lib/components/Sidebar.svelte`

**Interfaces:**
- Consumes: `NAV_ITEMS` from nav.js (now with `children` field)
- Produces: Sidebar that passes full `node` object to `NavItem`

- [ ] **Step 1: Update Sidebar.svelte**

Change the `<ul>` content from flat-prop passing to node-object passing:

```svelte
<ul class="sidebar-nav" role="list">
  {#each NAV_ITEMS as item (item.id)}
    <li>
      <NavItem node={item} depth={0} />
    </li>
  {/each}
</ul>
```

Remove old props: `id`, `label`, `iconName`, `accent`, `subItems`, `expandable` from the NavItem call. The `<script>` block no longer needs to pass those. The `lang="ts"` attribute should be added to `<script>`.

- [ ] **Step 2: Run svelte-check**

Run: `cd frontend && npx svelte-check 2>&1 | tail -5`
Expected: `0 ERRORS 0 WARNINGS`

---

### Task 5: Create Breadcrumb.svelte

**Files:**
- Create: `frontend/src/lib/components/Breadcrumb.svelte`

**Interfaces:**
- Consumes: `items: {label: string; href: string}[]`
- Produces: Reusable breadcrumb bar used by `[...slug]/+page.svelte`

- [ ] **Step 1: Create Breadcrumb.svelte**

```svelte
<script lang="ts">
	interface BreadcrumbItem { label: string; href: string; }
	let { items }: { items: BreadcrumbItem[] } = $props();

	function formatLabel(text: string): string {
		return text.replace(/X(?=[a-z]|ion|ing|$)/g, '<span class="x-char">X</span>');
	}
</script>

{#if items.length > 0}
	<nav class="breadcrumb" aria-label="Breadcrumb">
		<ol class="crumb-list">
			<li class="crumb-item">
				<a class="crumb-link" href="/">Home</a>
			</li>
			{#each items as item, i}
				<li class="crumb-sep" aria-hidden="true">/</li>
				<li class="crumb-item">
					{#if i < items.length - 1}
						<a class="crumb-link" href={item.href}>{@html formatLabel(item.label)}</a>
					{:else}
						<span class="crumb-current" aria-current="page">{@html formatLabel(item.label)}</span>
					{/if}
				</li>
			{/each}
		</ol>
	</nav>
{/if}

<style>
	.breadcrumb { margin-bottom: 24px; }

	.crumb-list {
		list-style: none;
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 4px;
		padding: 0;
		margin: 0;
	}

	.crumb-item { display: flex; align-items: center; }

	.crumb-sep {
		color: var(--text-muted);
		font-size: 12px;
		opacity: 0.5;
		user-select: none;
	}

	.crumb-link {
		font-size: 12px;
		color: var(--text-muted);
		text-decoration: none;
		border-radius: 5px;
		padding: 2px 4px;
		transition: color 0.14s, background 0.14s;
	}

	.crumb-link:hover {
		color: var(--accent-primary);
		background: rgba(var(--accent-primary-rgb), 0.08);
	}

	.crumb-current {
		font-size: 12px;
		color: var(--text-primary);
		font-weight: 600;
		padding: 2px 4px;
	}
</style>
```

---

### Task 6: Update [...slug]/+page.svelte

**Files:**
- Modify: `frontend/src/routes/[...slug]/+page.svelte`

**Interfaces:**
- Consumes: `findNodeByPath` from nav.js, `Breadcrumb` component
- Produces: Enhanced catch-all page with 3-level breadcrumbs and accurate page titles

- [ ] **Step 1: Rewrite [...slug]/+page.svelte**

```svelte
<script lang="ts">
	import { page } from '$app/stores';
	import { NAV_ITEMS, findNodeByPath } from '$lib/data/nav.js';
	import { ICON_MAP } from '$lib/data/icons.js';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';

	const pathname = $derived($page.url.pathname);
	const result   = $derived(findNodeByPath(pathname));
	const crumbs   = $derived(result?.crumbs ?? []);
	const node     = $derived(result?.node ?? null);

	// Fall back to a best-effort title from the URL segments
	const segments = $derived(pathname.split('/').filter(Boolean));
	const topItem  = $derived(NAV_ITEMS.find(i => i.id === segments[0]));

	const displayTitle = $derived(
		node?.label
		?? crumbs[crumbs.length - 1]?.label
		?? capitalise(segments[segments.length - 1] ?? 'Page')
	);

	const accent = $derived(
		node?.accent
		?? topItem?.accent
		?? 'var(--accent-primary)'
	);

	// Resolved icon component
	const IconComp = $derived(
		node?.iconName ? (ICON_MAP[node.iconName] ?? null) : (topItem ? (ICON_MAP[topItem.iconName] ?? null) : null)
	);

	function capitalise(s: string): string {
		return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');
	}
</script>

<svelte:head>
	<title>{displayTitle} · OraCodeX Nexus</title>
</svelte:head>

<div class="page-shell">
	<Breadcrumb items={crumbs.slice(0, -1)} />

	<div class="coming-soon">
		<div class="card neo-convex elev-3">
			<div class="glow" style="background:radial-gradient(circle,{accent} 0%,transparent 70%)"></div>

			<div class="inner">
				<span class="badge" style="color:{accent};border-color:{accent}44;background:{accent}11">
					Coming Soon
				</span>

				<div class="title-row">
					{#if IconComp}
						<span class="page-icon" style:color={accent}>
							<IconComp size={36} strokeWidth={1.5} />
						</span>
					{/if}
					<h1 class="title">{displayTitle}</h1>
				</div>

				<p class="subtitle">
					This module is under active development.<br />
					Something powerful is on its way.
				</p>

				<a href="/" class="back-btn" style="--btn-accent:{accent};--btn-accent-rgb:0,212,255">
					← Back to Dashboard
				</a>
			</div>
		</div>
	</div>
</div>

<style>
	.page-shell {
		padding: 32px clamp(16px, 3vw, 48px);
		max-width: 720px;
		margin: 0 auto;
	}

	.coming-soon {
		display: flex;
		align-items: flex-start;
		justify-content: center;
	}

	.card {
		position: relative;
		width: 100%;
		background: var(--bg-base);
		border-radius: var(--radius-card, 24px);
		overflow: hidden;
	}

	.glow {
		position: absolute;
		top: -80px; left: 50%;
		transform: translateX(-50%);
		width: 300px; height: 300px;
		opacity: 0.06;
		pointer-events: none;
		filter: blur(40px);
		border-radius: 50%;
	}

	.inner {
		position: relative;
		z-index: 1;
		padding: 40px 36px 36px;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 14px;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		padding: 4px 12px;
		border-radius: 20px;
		border: 1px solid;
		font-size: 10.5px;
		font-weight: 700;
		letter-spacing: 0.09em;
		text-transform: uppercase;
	}

	.title-row {
		display: flex;
		align-items: center;
		gap: 14px;
	}

	.page-icon { display: flex; flex-shrink: 0; }

	.title {
		font-size: 28px;
		font-weight: 800;
		color: var(--text-accent);
		letter-spacing: -0.025em;
		line-height: 1.15;
		margin: 0;
	}

	.subtitle {
		font-size: 13.5px;
		color: var(--text-muted);
		line-height: 1.65;
		margin: 0;
	}

	.back-btn {
		margin-top: 6px;
		display: inline-flex;
		align-items: center;
		padding: 8px 18px;
		border-radius: 11px;
		border: 1px solid rgba(var(--accent-primary-rgb), 0.22);
		background: rgba(var(--accent-primary-rgb), 0.07);
		color: var(--accent-primary);
		text-decoration: none;
		font-size: 12.5px;
		font-weight: 600;
		letter-spacing: 0.02em;
		transition: background 0.15s, box-shadow 0.15s, border-color 0.15s;
	}

	.back-btn:hover {
		background: rgba(var(--accent-primary-rgb), 0.14);
		border-color: rgba(var(--accent-primary-rgb), 0.4);
		box-shadow: 0 0 12px rgba(var(--accent-primary-rgb), 0.14);
	}
</style>
```

- [ ] **Step 2: Run full build + svelte-check**

Run: `cd frontend && npx svelte-check 2>&1 | tail -3 && npm run build 2>&1 | tail -5`
Expected: `0 ERRORS 0 WARNINGS` and `✓ built`

---

## Self-Review

**Spec coverage:**
- ✓ All 6 sections registered
- ✓ All groups (Oracle Cloud ConverXion, IntegraXion, Cross ValidaXion, DataXMining, Cloud ActionX, Cloud Templates, Connections) have children
- ✓ All ~40 leaf routes mapped to hrefs
- ✓ `[...slug]` handles all routes as placeholder pages with breadcrumbs
- ✓ Sidebar supports unlimited nesting via `svelte:self`
- ✓ Active highlighting on `isCurrentPage`, ancestor highlighting on `isAncestor`
- ✓ Auto-expand on `$effect` watching `isActive`
- ✓ X-char gradient preserved via `formatLabel`
- ✓ Icons preserved and extended
- ✓ DashboardTile `subItems` preserved unchanged
- ✓ `lang="ts"` on all modified Svelte files
- ✓ No individual route files needed (catch-all)
- ✓ Mobile/responsive: sidebar is a fly-in overlay, no layout changes needed

**Gaps:** None found.
