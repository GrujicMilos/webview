import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';
import inherits from 'inherits';
import { is } from '../../../util/ModelUtil';

/**
 * FLOW specific create data object behavior
 */
export default function CreateDataObjectBehavior(eventBus, flowFactory, moddle) {

	CommandInterceptor.call(this, eventBus);

	this.preExecute('shape.create', function (event) {

		var context = event.context,
			shape = context.shape;

		if (is(shape, 'flow:DataObjectReference') && shape.type !== 'label') {

			// create a DataObject every time a DataObjectReference is created
			var dataObject = flowFactory.create('flow:DataObject');

			// set the reference to the DataObject
			shape.businessObject.dataObjectRef = dataObject;
		}
	});

}

CreateDataObjectBehavior.$inject = [
	'eventBus',
	'flowFactory',
	'moddle'
];

inherits(CreateDataObjectBehavior, CommandInterceptor);
