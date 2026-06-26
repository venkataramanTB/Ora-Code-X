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
	brand: 'OraCodeX Studio',
	separator: ' — The Intelligent Oracle Cloud Delivery Platform | ',
	keywords: [
		{ word: 'Extract',   color: '#ff4d6d' },
		{ word: 'Convert',   color: '#00d4ff' },
		{ word: 'Integrate', color: '#00e676' },
		{ word: 'Operate',   color: '#ff9800' },
		{ word: 'Validate',  color: '#b39ddb' },
		{ word: 'Deliver',   color: '#4fc3f7' }
	]
};
