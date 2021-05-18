import translate from 'diagram-js/lib/i18n/translate';

import FlowImporter from './FlowImporter';

export default {
	__depends__: [
		translate
	],
	flowImporter: ['type', FlowImporter],
};
