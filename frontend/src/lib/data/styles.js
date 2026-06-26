export const COLOR_KEY   = 'oracodex-color';
export const STYLE_KEY   = 'oracodex-style';
export const DEFAULT_COLOR_ID = 'dark';
export const DEFAULT_STYLE_ID = 'neo';

export const COLOR_MODES = {
	dark:  { id: 'dark',  name: 'Dark',  iconName: 'Moon' },
	light: { id: 'light', name: 'Light', iconName: 'Sun'  },
};

export const VISUAL_STYLES = {
	neo:     { id: 'neo',     name: 'Neomorphism',  desc: 'Soft extruded depth'       },
	minimal: { id: 'minimal', name: 'Minimal',      desc: 'Clean, flat, breathable'   },
	skeu:    { id: 'skeu',    name: 'Skeuomorphic', desc: 'Real-world material feel'  },
	brutal:  { id: 'brutal',  name: 'Brutalism',    desc: 'Raw, bold, uncompromising' },
	maximal: { id: 'maximal', name: 'Maximalism',   desc: 'Rich, layered, vivid'      },
};

// Clerk appearance vars keyed by color mode
export const CLERK_VARS = {
	dark: {
		colorBackground:        '#111620',
		colorInputBackground:   '#0d1117',
		colorInputText:         '#e8edf5',
		colorPrimary:           '#00d4ff',
		colorPrimaryForeground: '#0a0e14',
		colorText:              '#e8edf5',
		colorTextSecondary:     '#6b7a99',
		colorNeutral:           '#4a5568',
		colorDanger:            '#ff4d6d',
	},
	light: {
		colorBackground:        '#eef1f7',
		colorInputBackground:   '#ffffff',
		colorInputText:         '#1a2540',
		colorPrimary:           '#0096cc',
		colorPrimaryForeground: '#ffffff',
		colorText:              '#1a2540',
		colorTextSecondary:     '#8090b0',
		colorNeutral:           '#6080a0',
		colorDanger:            '#e53e3e',
	},
};
