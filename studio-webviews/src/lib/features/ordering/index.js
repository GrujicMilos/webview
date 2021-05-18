import translate from 'diagram-js/lib/i18n/translate';
import FlowOrderingProvider from './FlowOrderingProvider';

export default {
	__depends__: [
		translate
	],
	__init__: ['flowOrderingProvider'],
	flowOrderingProvider: ['type', FlowOrderingProvider]
};
