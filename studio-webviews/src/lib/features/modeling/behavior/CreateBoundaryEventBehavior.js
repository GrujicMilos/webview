import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';
import inherits from 'inherits';
import { is } from '../../../util/ModelUtil';

/**
 * FLOW specific create boundary event behavior
 */
export default function CreateBoundaryEventBehavior(
	eventBus, modeling, elementFactory,
	flowFactory) {

	CommandInterceptor.call(this, eventBus);

	/**
	 * replace intermediate event with boundary event when
	 * attaching it to a shape
	 */

	this.preExecute('shape.create', function (context) {
		var shape = context.shape,
			host = context.host,
			businessObject,
			boundaryEvent;

		var attrs = {
			cancelActivity: true
		};

		if (host && is(shape, 'flow:State')) {
			attrs.attachedToRef = host.businessObject;

			businessObject = flowFactory.create('flow:BoundaryEvent', attrs);

			boundaryEvent = {
				type: 'flow:BoundaryEvent',
				businessObject: businessObject
			};

			context.shape = elementFactory.createShape(boundaryEvent);
		}
	}, true);
}

CreateBoundaryEventBehavior.$inject = [
	'eventBus',
	'modeling',
	'elementFactory',
	'flowFactory'
];

inherits(CreateBoundaryEventBehavior, CommandInterceptor);
