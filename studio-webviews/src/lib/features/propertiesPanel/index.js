import PropertiesPanel from './PropertiesPanel';

export default {
	__depends__: [
		require('diagram-js/lib/i18n/translate').default
	],
	__init__: ['propertiesPanel'],
	propertiesPanel: ['type', PropertiesPanel]
};
