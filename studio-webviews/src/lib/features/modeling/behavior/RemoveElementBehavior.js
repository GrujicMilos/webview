import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';
import inherits from 'inherits';
import lineIntersect from './util/LineIntersect';

export default function RemoveElementBehavior(eventBus, flowRules, modeling) {

	CommandInterceptor.call(this, eventBus);

	/**
	 * Combine sequence flows when deleting an element
	 * if there is one incoming and one outgoing
	 * sequence flow
	 */
	this.preExecute('shape.delete', function (e) {

		var shape = e.context.shape;

		if (shape.incoming.length == 1 && shape.outgoing.length == 1) {

			var inConnection = shape.incoming[0],
				outConnection = shape.outgoing[0];


			if (flowRules.canConnect(inConnection.source, outConnection.target, inConnection)) {

				// compute new, combined waypoints
				var newWaypoints = getNewWaypoints(inConnection.waypoints, outConnection.waypoints);

				modeling.reconnectEnd(inConnection, outConnection.target, newWaypoints);
			}
		}
	});

}

inherits(RemoveElementBehavior, CommandInterceptor);

RemoveElementBehavior.$inject = [
	'eventBus',
	'flowRules',
	'modeling'
];


// helpers //////////////////////

function getDocking(point) {
	return point.original || point;
}


function getNewWaypoints(inWaypoints, outWaypoints) {

	var intersection = lineIntersect(
		getDocking(inWaypoints[inWaypoints.length - 2]),
		getDocking(inWaypoints[inWaypoints.length - 1]),
		getDocking(outWaypoints[1]),
		getDocking(outWaypoints[0]));

	if (intersection) {
		return [].concat(
			inWaypoints.slice(0, inWaypoints.length - 1),
			[intersection],
			outWaypoints.slice(1));
	} else {
		return [
			getDocking(inWaypoints[0]),
			getDocking(outWaypoints[outWaypoints.length - 1])
		];
	}
}
