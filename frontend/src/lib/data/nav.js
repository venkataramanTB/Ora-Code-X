/**
 * @typedef {{ id: string, label: string, href?: string, iconName?: string, accent?: string, children?: NavNode[] }} NavNode
 */

/** @type {import('./nav.js').NavItem[]} */
export const NAV_ITEMS = [
	{
		id: 'delivery',
		label: 'DeliveryX',
		href: '/delivery',
		iconName: 'Rocket',
		accent: '#00d4ff',
		accentGlow: 'rgba(0, 212, 255, 0.15)',
		gridArea: 'delivery',
		size: 'hero',
		subItems: [
			{ label: 'Smart Genesis ConveX',    href: '/delivery/conversion'   },
			{ label: 'IntegraXion',             href: '/delivery/integration'  },
			{ label: 'Cross ValidaXion',        href: '/delivery/validation'   },
			{ label: 'DataXMining',             href: '/delivery/mining'       },
			{ label: 'Cloud ActionX',           href: '/delivery/actions'      },
			{ label: 'IntelliXight Report AI',  href: '/delivery/intellixight' },
		],
		children: [
			{
				id: 'conversion-group',
				label: 'Smart Genesis ConveX',
				iconName: 'RefreshCw',
				accent: '#00d4ff',
				children: [
					{ id: 'conversion', label: 'Smart Genesis ConveX', href: '/delivery/conversion', iconName: 'RefreshCw', children: [] },
				],
			},
			{
				id: 'integration',
				label: 'IntegraXion',
				href: '/delivery/integration',
				iconName: 'GitMerge',
				accent: '#00d4ff',
				children: [
					{ id: 'inbound',  label: 'Cloud Inbound Integration',  href: '/delivery/integration/inbound',  iconName: 'ArrowDownToLine', children: [] },
					{ id: 'outbound', label: 'Cloud Outbound Integration', href: '/delivery/integration/outbound', iconName: 'ArrowUpToLine',   children: [] },
					{ id: 'pbcs',     label: 'Oracle PBCS Integration',    href: '/delivery/integration/pbcs',     iconName: 'ChartBar',        children: [] },
					{ id: 'edi',      label: 'EDI Integration',            href: '/delivery/integration/edi',      iconName: 'FileCode',        children: [] },
				],
			},
			{
				id: 'validation',
				label: 'Cross ValidaXion',
				href: '/delivery/validation',
				iconName: 'CircleCheck',
				accent: '#00d4ff',
				children: [
					{ id: 'pre-val',  label: 'Pre Load Validation',  href: '/delivery/validation/pre',  iconName: 'ListChecks',  children: [] },
					{ id: 'post-val', label: 'Post Load Validation', href: '/delivery/validation/post', iconName: 'SquareCheck', children: [] },
				],
			},
			{
				id: 'mining-group',
				label: 'DataXMining',
				iconName: 'Database',
				accent: '#00d4ff',
				children: [
					{ id: 'mining', label: 'Data Mining', href: '/delivery/mining', iconName: 'Database', children: [] },
				],
			},
			{
				id: 'actions',
				label: 'Cloud ActionX',
				href: '/delivery/actions',
				iconName: 'Zap',
				accent: '#00d4ff',
				children: [
					{ id: 'delete-po',       label: 'Delete Purchase Orders',  href: '/delivery/actions/delete-po',       iconName: 'Trash2',     children: [] },
					{ id: 'cancel-ap',       label: 'Cancel AP Invoices',      href: '/delivery/actions/cancel-ap',       iconName: 'CircleX',    children: [] },
					{ id: 'cancel-to',       label: 'Cancel Transfer Orders',  href: '/delivery/actions/cancel-to',       iconName: 'PackageX',   children: [] },
					{ id: 'cancel-receipts', label: 'Cancel Receipts',         href: '/delivery/actions/cancel-receipts', iconName: 'ClipboardX', children: [] },
					{ id: 'delete-req',      label: 'Delete Requisitions',     href: '/delivery/actions/delete-req',      iconName: 'Trash2',     children: [] },
					{ id: 'update-item',     label: 'Update Item Status',      href: '/delivery/actions/update-item',     iconName: 'RefreshCw',  children: [] },
					{ id: 'submit-ess',      label: 'Submit ESS Jobs',         href: '/delivery/actions/submit-ess',      iconName: 'Play',       children: [] },
					{ id: 'reprocess',       label: 'Reprocess Transactions',  href: '/delivery/actions/reprocess',       iconName: 'RotateCcw',  children: [] },
					{ id: 'rest-apis',       label: 'Custom REST APIs',        href: '/delivery/actions/rest-apis',       iconName: 'Code',       children: [] },
				],
			},
			{
				id: 'intellixight',
				label: 'IntelliXight Report AI',
				href: '/delivery/intellixight',
				iconName: 'BarChart2',
				accent: '#00d4ff',
				children: [],
			},
		],
	},
	{
		id: 'mytools',
		label: 'My Tools',
		href: '/mytools',
		iconName: 'Wrench',
		accent: '#f5a623',
		accentGlow: 'rgba(245, 166, 35, 0.15)',
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
			{ id: 'reports',   label: 'Report and Analytics', href: '/mytools/reports',   iconName: 'ChartBar',       accent: '#f5a623', children: [] },
			{
				id: 'templates',
				label: 'Cloud Templates',
				href: '/mytools/templates',
				iconName: 'FolderOpen',
				accent: '#f5a623',
				children: [
					{ id: 'fbdi', label: 'FBDI Templates', href: '/mytools/templates/fbdi', iconName: 'FileSpreadsheet', children: [] },
					{ id: 'hdl',  label: 'HDL Templates',  href: '/mytools/templates/hdl',  iconName: 'FileText',        children: [] },
				],
			},
			{ id: 'mappings',  label: 'Mappings',       href: '/mytools/mappings',  iconName: 'MapPin',        accent: '#f5a623', children: [] },
			{ id: 'parser',    label: 'File Parser',    href: '/mytools/parser',    iconName: 'FileSearch',    accent: '#f5a623', children: [] },
			{ id: 'scheduler', label: 'Scheduler',      href: '/mytools/scheduler', iconName: 'CalendarClock', accent: '#f5a623', children: [] },
			{ id: 'encrypt',   label: 'Encryptography', href: '/mytools/encrypt',   iconName: 'Lock',          accent: '#f5a623', children: [] },
			{ id: 'masking',   label: 'Data Masking',   href: '/mytools/masking',   iconName: 'EyeOff',        accent: '#f5a623', children: [] },
		],
	},
	{
		id: 'workspace',
		label: 'Work Space',
		href: '/workspace',
		iconName: 'LayoutDashboard',
		accent: '#ff4d6d',
		accentGlow: 'rgba(255, 77, 109, 0.15)',
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
		accentGlow: 'rgba(0, 230, 118, 0.15)',
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
		accentGlow: 'rgba(79, 195, 247, 0.15)',
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
		accentGlow: 'rgba(179, 157, 219, 0.15)',
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
					{ id: 'database', label: 'Database Connections', href: '/admin/connections/database', iconName: 'Database', children: [] },
					{ id: 'saas',     label: 'Oracle Cloud SaaS',    href: '/admin/connections/saas',     iconName: 'Cloud',    children: [] },
					{ id: 'sftp',     label: 'SFTP Server',          href: '/admin/connections/sftp',     iconName: 'Server',   children: [] },
				],
			},
			{ id: 'audit',   label: 'Audit Logs', href: '/admin/audit',   iconName: 'BookOpen', accent: '#b39ddb', children: [] },
			{ id: 'license', label: 'License',    href: '/admin/license', iconName: 'FileText', accent: '#b39ddb', children: [] },
		],
	},
];

/**
 * Walk the full nav tree and return breadcrumb trail + matched node for a pathname.
 * @param {string} pathname
 * @returns {{ crumbs: {label:string, href:string}[], node: NavNode|null }}
 */
export function findNodeByPath(pathname) {
	/** @param {NavNode[]} nodes @param {{label:string,href:string}[]} trail */
	function walk(nodes, trail) {
		for (const node of nodes) {
			const next = node.href ? [...trail, { label: node.label, href: node.href }] : [...trail];
			if (node.href === pathname) return { crumbs: next, node };
			if (node.children?.length) {
				const result = walk(node.children, next);
				if (result) return result;
			}
		}
		return null;
	}

	for (const item of NAV_ITEMS) {
		const trail = [{ label: item.label, href: item.href ?? `/${item.id}` }];
		if ((item.href ?? `/${item.id}`) === pathname) return { crumbs: trail, node: item };
		const result = walk(item.children ?? [], trail);
		if (result) return result;
	}
	return { crumbs: [], node: null };
}

export const TAGLINE = {
	prefix:    'Welcome to ',
	brand:     'Smart Genesis ConveX',
	separator: ' — The next generation Oracle Cloud conversion engine that transforms enterprise data into cloud-ready intelligence through precision-driven transformation.',
	keywords:  [],
};

export const SMART_GENESIS_TAGLINE = {
	prefix:      'Welcome to ',
	title:       'Smart Genesis ConveX',
	description: 'The next generation Oracle Cloud conversion engine that transforms enterprise data into cloud-ready intelligence through precision-driven transformation.',
};
