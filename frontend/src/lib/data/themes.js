export const THEME_KEY      = 'oracodex-theme';
export const DEFAULT_THEME_ID = 'dark';

export const THEMES = {
	dark: {
		id: 'dark',
		name: 'Neomorphic Dark',
		accent: '#00d4ff',
		preview: ['#13171f', '#00d4ff'],
		clerk: {
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
	},

	void: {
		id: 'void',
		name: 'Void Purple',
		accent: '#b39ddb',
		preview: ['#0f0d1a', '#b39ddb'],
		clerk: {
			colorBackground:        '#0f0d1a',
			colorInputBackground:   '#0a0814',
			colorInputText:         '#e8e2f5',
			colorPrimary:           '#b39ddb',
			colorPrimaryForeground: '#0a0814',
			colorText:              '#e8e2f5',
			colorTextSecondary:     '#6b5f99',
			colorNeutral:           '#4a4060',
			colorDanger:            '#ff4d6d',
		},
	},

	ember: {
		id: 'ember',
		name: 'Ember Crimson',
		accent: '#ff4d6d',
		preview: ['#1a0e11', '#ff4d6d'],
		clerk: {
			colorBackground:        '#1a0e11',
			colorInputBackground:   '#120a0d',
			colorInputText:         '#f5e2e6',
			colorPrimary:           '#ff4d6d',
			colorPrimaryForeground: '#120a0d',
			colorText:              '#f5e2e6',
			colorTextSecondary:     '#8a5a65',
			colorNeutral:           '#604050',
			colorDanger:            '#ff4d6d',
		},
	},

	forest: {
		id: 'forest',
		name: 'Forest Emerald',
		accent: '#00e676',
		preview: ['#0a1512', '#00e676'],
		clerk: {
			colorBackground:        '#0a1512',
			colorInputBackground:   '#060f0c',
			colorInputText:         '#e2f5ec',
			colorPrimary:           '#00e676',
			colorPrimaryForeground: '#060f0c',
			colorText:              '#e2f5ec',
			colorTextSecondary:     '#4d8a6a',
			colorNeutral:           '#405a4a',
			colorDanger:            '#ff4d6d',
		},
	},

	solar: {
		id: 'solar',
		name: 'Solar Gold',
		accent: '#f5a623',
		preview: ['#181208', '#f5a623'],
		clerk: {
			colorBackground:        '#181208',
			colorInputBackground:   '#100e04',
			colorInputText:         '#f5ecda',
			colorPrimary:           '#f5a623',
			colorPrimaryForeground: '#100e04',
			colorText:              '#f5ecda',
			colorTextSecondary:     '#8a7040',
			colorNeutral:           '#604820',
			colorDanger:            '#ff4d6d',
		},
	},

	arctic: {
		id: 'arctic',
		name: 'Arctic Light',
		accent: '#0096cc',
		preview: ['#eef1f7', '#0096cc'],
		clerk: {
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
	},
};
