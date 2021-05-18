import RulesModule from 'diagram-js/lib/features/rules';
import FlowRules from './FlowRules';

export default {
	__depends__: [
		RulesModule
	],
	__init__: ['flowRules'],
	flowRules: ['type', FlowRules]
};
