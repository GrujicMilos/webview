import Snapping from 'diagram-js/lib/features/snapping/Snapping';
import { bottomRight, isSnapped, mid, setSnapped, topLeft } from 'diagram-js/lib/features/snapping/SnapUtil';
import { asTRBL } from 'diagram-js/lib/layout/LayoutUtil';
import { getBBox as getBoundingBox } from 'diagram-js/lib/util/Elements';
import inherits from 'inherits';
import { forEach } from 'min-dash';
import { is } from '../../util/ModelUtil';
import { getLanesRoot } from '../modeling/util/LaneUtil';
import { isAny } from '../modeling/util/ModelingUtil';
import { getBoundaryAttachment } from './FlowSnappingUtil';
var round = Math.round;
var HIGH_PRIORITY = 1500;

/**
 * FLOW specific snapping functionality
 *
 *  * snap on process elements if a pool is created inside a
 *    process diagram
 *
 * @param {EventBus} eventBus
 * @param {Canvas} canvas
 */
export default function FlowSnapping(eventBus, canvas, flowRules, elementRegistry) {

	// instantiate super
	Snapping.call(this, eventBus, canvas);


	eventBus.on(['create.move', 'create.end'], HIGH_PRIORITY, function (event) {

		var context = event.context,
			shape = context.shape,
			participantSnapBox = context.participantSnapBox;

		if (!isSnapped(event) && participantSnapBox) {
			snapParticipant(participantSnapBox, shape, event);
		}
	});

	eventBus.on('shape.move.start', function (event) {

		var context = event.context,
			shape = context.shape,
			rootElement = canvas.getRootElement();

		// snap participant around existing elements (if any)
		if ((is(shape, 'flow:State') || is(shape, 'flow:Related')) && is(rootElement, 'flow:Plane')) {
			initParticipantSnapping(context, shape, rootElement.children);
		}
	});


	function canAttach(shape, target, position) {
		return flowRules.canAttach([shape], target, null, position) === 'attach';
	}

	function canConnect(source, target) {
		return flowRules.canConnect(source, target);
	}

	/**
	 * Snap boundary events to elements border
	 */
	eventBus.on([
		'create.move',
		'create.end',
		'shape.move.move',
		'shape.move.end'
	], HIGH_PRIORITY, function (event) {

		var context = event.context,
			target = context.target,
			shape = context.shape;

		if (target && !isSnapped(event) && canAttach(shape, target, event)) {
			snapBoundaryEvent(event, shape, target);
		}
	});

	/**
	 * Adjust parent for flowElements to the target participant
	 * when droping onto lanes.
	 */
	eventBus.on([
		'shape.move.hover',
		'shape.move.move',
		'shape.move.end',
		'create.hover',
		'create.move',
		'create.end'
	], HIGH_PRIORITY, function (event) {
		var context = event.context,
			shape = context.shape,
			hover = event.hover;

		if (is(hover, 'flow:Lane') && !isAny(shape, ['flow:Lane', 'flow:Participant'])) {
			event.hover = getLanesRoot(hover);
			event.hoverGfx = elementRegistry.getGraphics(event.hover);
		}
	});

	/**
	 * Snap sequence flows.
	 */
	eventBus.on([
		'connect.move',
		'connect.hover',
		'connect.end'
	], HIGH_PRIORITY, function (event) {
		var context = event.context,
			source = context.source,
			target = context.target;

		var connection = canConnect(source, target) || {};

		if (!context.initialSourcePosition) {
			context.initialSourcePosition = context.sourcePosition;
		}

		if (
			target && (
				connection.type === 'flow:State'
			)
		) {
			// snap source
			context.sourcePosition = mid(source);

			// snap target
			snapToPosition(event, mid(target));
		}
		else {
			// otherwise reset source snap
			context.sourcePosition = context.initialSourcePosition;
		}

	});
}

inherits(FlowSnapping, Snapping);

FlowSnapping.$inject = [
	'eventBus',
	'canvas',
	'flowRules',
	'elementRegistry'
];


FlowSnapping.prototype.initSnap = function (event) {

	var context = event.context,
		shape = event.shape,
		shapeMid,
		shapeBounds,
		shapeTopLeft,
		shapeBottomRight,
		snapContext;


	snapContext = Snapping.prototype.initSnap.call(this, event);

	if (shape) {

		shapeMid = mid(shape, event);

		shapeBounds = {
			width: shape.width,
			height: shape.height,
			x: isNaN(shape.x) ? round(shapeMid.x - shape.width / 2) : shape.x,
			y: isNaN(shape.y) ? round(shapeMid.y - shape.height / 2) : shape.y
		};

		shapeTopLeft = topLeft(shapeBounds);
		shapeBottomRight = bottomRight(shapeBounds);

		snapContext.setSnapOrigin('top-left', {
			x: shapeTopLeft.x - event.x,
			y: shapeTopLeft.y - event.y
		});

		snapContext.setSnapOrigin('bottom-right', {
			x: shapeBottomRight.x - event.x,
			y: shapeBottomRight.y - event.y
		});

		forEach(shape.outgoing, function (c) {
			var docking = c.waypoints[0];

			docking = docking.original || docking;

			snapContext.setSnapOrigin(c.id + '-docking', {
				x: docking.x - event.x,
				y: docking.y - event.y
			});
		});

		forEach(shape.incoming, function (c) {
			var docking = c.waypoints[c.waypoints.length - 1];

			docking = docking.original || docking;

			snapContext.setSnapOrigin(c.id + '-docking', {
				x: docking.x - event.x,
				y: docking.y - event.y
			});
		});

	}

	var source = context.source;

	if (source) {
		snapContext.addDefaultSnap('mid', mid(source));
	}
};


FlowSnapping.prototype.addTargetSnaps = function (snapPoints, shape, target) {

	var siblings = this.getSiblings(shape, target) || [];

	forEach(siblings, function (sibling) {

		if (sibling.waypoints) {

			forEach(sibling.waypoints.slice(1, -1), function (waypoint, i) {
				var nextWaypoint = sibling.waypoints[i + 2],
					previousWaypoint = sibling.waypoints[i];

				if (!nextWaypoint || !previousWaypoint) {
					throw new Error('waypoints must exist');
				}

				if (nextWaypoint.x === waypoint.x ||
					nextWaypoint.y === waypoint.y ||
					previousWaypoint.x === waypoint.x ||
					previousWaypoint.y === waypoint.y) {
					snapPoints.add('mid', waypoint);
				}
			});

			return;
		}
		snapPoints.add('mid', mid(sibling));
	});


	forEach(shape.incoming, function (c) {

		if (siblings.indexOf(c.source) === -1) {
			snapPoints.add('mid', mid(c.source));
		}

		var docking = c.waypoints[0];
		snapPoints.add(c.id + '-docking', docking.original || docking);
	});


	forEach(shape.outgoing, function (c) {

		if (siblings.indexOf(c.target) === -1) {
			snapPoints.add('mid', mid(c.target));
		}

		var docking = c.waypoints[c.waypoints.length - 1];
		snapPoints.add(c.id + '-docking', docking.original || docking);
	});
};


// participant snapping //////////////////////

function initParticipantSnapping(context, shape, elements) {

	if (!elements.length) {
		return;
	}

	var snapBox = getBoundingBox(elements.filter(function (e) {
		return !e.labelTarget && !e.waypoints;
	}));

	snapBox.x -= 50;
	snapBox.y -= 20;
	snapBox.width += 70;
	snapBox.height += 40;

	context.participantSnapBox = snapBox;
}

function snapParticipant(snapBox, shape, event, offset) {
	offset = offset || 0;

	var shapeHalfWidth = shape.width / 2 - offset,
		shapeHalfHeight = shape.height / 2;

	var currentTopLeft = {
		x: event.x - shapeHalfWidth - offset,
		y: event.y - shapeHalfHeight
	};

	var currentBottomRight = {
		x: event.x + shapeHalfWidth + offset,
		y: event.y + shapeHalfHeight
	};

	var snapTopLeft = snapBox,
		snapBottomRight = bottomRight(snapBox);

	if (currentTopLeft.x >= snapTopLeft.x) {
		setSnapped(event, 'x', snapTopLeft.x + offset + shapeHalfWidth);
	} else if (currentBottomRight.x <= snapBottomRight.x) {
		setSnapped(event, 'x', snapBottomRight.x - offset - shapeHalfWidth);
	}

	if (currentTopLeft.y >= snapTopLeft.y) {
		setSnapped(event, 'y', snapTopLeft.y + shapeHalfHeight);
	} else if (currentBottomRight.y <= snapBottomRight.y) {
		setSnapped(event, 'y', snapBottomRight.y - shapeHalfHeight);
	}
}


// boundary event snapping //////////////////////

function snapBoundaryEvent(event, shape, target) {
	var targetTRBL = asTRBL(target);

	var direction = getBoundaryAttachment(event, target);

	if (/top/.test(direction)) {
		setSnapped(event, 'y', targetTRBL.top);
	} else if (/bottom/.test(direction)) {
		setSnapped(event, 'y', targetTRBL.bottom);
	}

	if (/left/.test(direction)) {
		setSnapped(event, 'x', targetTRBL.left);
	} else if (/right/.test(direction)) {
		setSnapped(event, 'x', targetTRBL.right);
	}
}


function snapToPosition(event, position) {
	setSnapped(event, 'x', position.x);
	setSnapped(event, 'y', position.y);
}
