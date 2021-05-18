import { repairConnection, withoutRedundantPoints } from 'diagram-js/lib/layout/ManhattanLayout';

import BaseLayouter from 'diagram-js/lib/layout/BaseLayouter';
import { assign } from 'min-dash';
import { getMid } from 'diagram-js/lib/layout/LayoutUtil';
import inherits from 'inherits';
import { is } from '../../util/ModelUtil';

export default function FlowLayouter() {
}

inherits(FlowLayouter, BaseLayouter);


FlowLayouter.prototype.layoutConnection = function (connection, hints) {
	hints = hints || {};

	var source = hints.source || connection.source,
		target = hints.target || connection.target,
		waypoints = connection.waypoints,
		start = hints.connectionStart,
		end = hints.connectionEnd;

	var manhattanOptions,
		updatedWaypoints;

	if (!start) {
		start = getConnectionDocking(waypoints && waypoints[0], source);
	}

	if (!end) {
		end = getConnectionDocking(waypoints && waypoints[waypoints.length - 1], target);
	}

	// layout all connection between flow elements h:h,
	//
	// except for
	//
	// (1) outgoing of BoundaryEvents -> layout based on attach orientation and target orientation
	// (2) incoming / outgoing of Gateway -> v:h (outgoing), h:v (incoming)
	// (3) loops from / to the same element
	//
	if (is(connection, 'flow:Relationship')) {

		// if (source === target) {
		// 	manhattanOptions = {
		// 		preferredLayouts: ['b:l']
		// 	};
		// } else {
		// 	manhattanOptions = {
		// 		preferredLayouts: ['h:h']
		// 	};
		// }

	}

	if (manhattanOptions) {

		manhattanOptions = assign(manhattanOptions, hints);

		updatedWaypoints =
			withoutRedundantPoints(
				repairConnection(
					source, target,
					start, end,
					waypoints,
					manhattanOptions
				)
			);
	}

	return updatedWaypoints || [start, end];
};


function getConnectionDocking(point, shape) {
	return point ? (point.original || point) : getMid(shape);
}
