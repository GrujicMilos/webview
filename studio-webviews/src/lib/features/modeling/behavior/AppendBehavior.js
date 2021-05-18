import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';
import inherits from 'inherits';
import { is } from '../../../util/ModelUtil';

export default function AppendBehavior(eventBus, elementFactory, flowRules) {

	CommandInterceptor.call(this, eventBus);

	// assign correct shape position unless already set

	this.preExecute('shape.append', function (context) {

		var source = context.source,
			shape = context.shape;

		if (!context.position) {

			if (is(shape, 'flow:TextAnnotation')) {
				context.position = {
					x: source.x + source.width / 2 + 75,
					y: source.y - (50) - shape.height / 2
				};
			} else {
				context.position = {
					x: source.x + source.width + 80 + shape.width / 2,
					y: source.y + source.height / 2
				};
			}
		}
	}, true);
}

inherits(AppendBehavior, CommandInterceptor);

AppendBehavior.$inject = [
	'eventBus',
	'elementFactory',
	'flowRules'
];
