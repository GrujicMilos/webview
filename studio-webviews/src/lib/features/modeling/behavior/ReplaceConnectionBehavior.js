import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';
import inherits from 'inherits';
import { find, forEach, matchPattern } from 'min-dash';

export default function ReplaceConnectionBehavior(eventBus, modeling, flowRules) {

	CommandInterceptor.call(this, eventBus);

	function fixConnection(connection) {

		var source = connection.source,
			target = connection.target,
			parent = connection.parent;

		// do not do anything if connection
		// is already deleted (may happen due to other
		// behaviors plugged-in before)
		if (!parent) {
			return;
		}

		var replacementType,
			remove;


		// remove invalid connection,
		// unless it has been removed already
		if (remove) {
			modeling.removeConnection(connection);
		}

		// replace SequenceFlow <> MessageFlow

		if (replacementType) {
			modeling.connect(source, target, {
				type: replacementType,
				waypoints: connection.waypoints.slice()
			});
		}
	}

	this.postExecuted('elements.move', function (context) {

		var closure = context.closure,
			allConnections = closure.allConnections;

		forEach(allConnections, fixConnection);
	}, true);

	this.postExecuted([
		'connection.reconnectStart',
		'connection.reconnectEnd',
		'connection.reconnect'
	], function (event) {

		var connection = event.context.connection;

		fixConnection(connection);
	});

	this.postExecuted('element.updateProperties', function (event) {
		var context = event.context,
			properties = context.properties,
			element = context.element,
			businessObject = element.businessObject,
			connection;

		// remove condition expression when morphing to default flow
		if (properties.default) {
			connection = find(
				element.outgoing,
				matchPattern({ id: element.businessObject.default.id })
			);

			if (connection) {
				modeling.updateProperties(connection, { conditionExpression: undefined });
			}
		}

		// remove default property from source when morphing to conditional flow
		if (properties.conditionExpression && businessObject.source.default === businessObject) {
			modeling.updateProperties(element.source, { default: undefined });
		}
	});
}

inherits(ReplaceConnectionBehavior, CommandInterceptor);

ReplaceConnectionBehavior.$inject = [
	'eventBus',
	'modeling',
	'flowRules'
];
