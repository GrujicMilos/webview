import GlobalConnectModule from 'diagram-js/lib/features/global-connect';
import FlowGlobalConnect from './FlowGlobalConnect';

export default {
	__depends__: [
		GlobalConnectModule
	],
	__init__: ['flowGlobalConnect'],
	flowGlobalConnect: ['type', FlowGlobalConnect]
};
