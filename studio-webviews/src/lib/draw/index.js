import FlowRenderer from './FlowRenderer';
import TextRenderer from './TextRenderer';

export default {
	__init__: ['flowRenderer'],
	flowRenderer: ['type', FlowRenderer],
	textRenderer: ['type', TextRenderer]
};
