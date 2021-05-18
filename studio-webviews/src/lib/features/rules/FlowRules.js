import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';
import inherits from 'inherits';
import { is } from '../../util/ModelUtil';
import { isAny } from '../modeling/util/ModelingUtil';
import { getBoundaryAttachment as isBoundaryAttachment } from '../snapping/FlowSnappingUtil';
import { isLabel } from '../../util/LabelUtil';

/**
 * FLOW specific modeling rule
 */
export default function FlowRules(eventBus) {
	RuleProvider.call(this, eventBus);
}

inherits(FlowRules, RuleProvider);

FlowRules.$inject = ['eventBus'];

FlowRules.prototype.init = function () {

	this.addRule('connection.create', function (context) {
		var source = context.source,
			target = context.target,
			hints = context.hints || {},
			targetParent = hints.targetParent,
			targetAttach = hints.targetAttach;

		// don't allow incoming connections on
		// newly created boundary events
		// to boundary events
		if (targetAttach) {
			return false;
		}

		// temporarily set target parent for scoping
		// checks to work
		if (targetParent) {
			target.parent = targetParent;
		}

		try {
			return canConnect(source, target);
		} finally {
			// unset temporary target parent
			if (targetParent) {
				target.parent = null;
			}
		}
	});

	this.addRule('connection.reconnect', function(context){
		var connection = context.connection,
		source = context.hover || context.source,
		target = connection.target;

	return canConnect(source, target, connection);
	});

	this.addRule('connection.updateWaypoints', function (context) {
		return {
			type: context.connection.type
		};
	});

	this.addRule('shape.resize', function (context) {

		var shape = context.shape,
			newBounds = context.newBounds;

		return canResize(shape, newBounds);
	});

	this.addRule('elements.move', function (context) {

		var target = context.target,
			shapes = context.shapes,
			position = context.position;

		return canAttach(shapes, target, null, position) ||
			canReplace(shapes, target, position) ||
			canMove(shapes, target, position) ||
			canInsert(shapes, target, position);
	});

	this.addRule('shape.create', function (context) {
		return canCreate(
			context.shape,
			context.target,
			context.source,
			context.position
		);
	});

	this.addRule('shape.attach', function (context) {

		return canAttach(
			context.shape,
			context.target,
			null,
			context.position
		);
	});

	this.addRule('element.copy', function (context) {
		var collection = context.collection,
			element = context.element;

		return canCopy(collection, element);
	});

	this.addRule('element.paste', function (context) {
		var parent = context.parent,
			element = context.element,
			position = context.position,
			source = context.source,
			target = context.target;

		if (source || target) {
			return canConnect(source, target);
		}

		return canAttach([element], parent, null, position) || canCreate(element, parent, null, position);
	});

	this.addRule('elements.paste', function (context) {
		var tree = context.tree,
			target = context.target;

		return canPaste(tree, target);
	});
};

FlowRules.prototype.canMove = canMove;

FlowRules.prototype.canAttach = canAttach;

FlowRules.prototype.canReplace = canReplace;

FlowRules.prototype.canDrop = canDrop;

FlowRules.prototype.canInsert = canInsert;

FlowRules.prototype.canCreate = canCreate;

FlowRules.prototype.canConnect = canConnect;

FlowRules.prototype.canResize = canResize;

FlowRules.prototype.canCopy = canCopy;

/**
 * Utility functions for rule checking
 */

function nonExistantOrLabel(element) {
	return !element || isLabel(element);
}

function isSame(a, b) {
	return a === b;
}

function getParents(element) {

	var parents = [];

	while (element) {
		element = element.parent;

		if (element) {
			parents.push(element);
		}
	}

	return parents;
}

function isParent(possibleParent, element) {
	var allParents = getParents(element);
	return allParents.indexOf(possibleParent) !== -1;
}

function canConnect(source, target, connection) {

	if (nonExistantOrLabel(source) || nonExistantOrLabel(target)) {
		return null;
	}

	if (is(source, 'flow:State') && is(target, 'flow:State')) {
		return {
			type: 'flow:Relationship',
			direction: 'Forward'
		};
	}

	if (is(source, 'flow:State') && is(target, 'flow:Related')) {
		return {
			type: 'flow:Relationship',
			direction: 'Forward'
		};
	}

	return false;
}

/**
 * Can an element be dropped into the target element
 *
 * @return {Boolean}
 */
function canDrop(element, target, position) {

	// can move labels everywhere
	if (isLabel(element)) {
		return true;
	}

	// allow to create new participants on
	// on existing collaboration and process diagrams
	if (is(element, 'flow:State')) {
		return is(target, 'flow:Plane');
	}

	if (is(element, 'flow:Related')) {
		return is(target, 'flow:Plane');
	}

	return false;
}

function canPaste(tree, target) {
	var topLevel = tree[0],
		participants;

	console.log('can paste');

	if (is(target, 'flow:Plane')) {
		return true;
	}
}


/**
 * We treat IntermediateThrowEvents as boundary events during create,
 * this must be reflected in the rules.
 */
function isBoundaryCandidate(element) {
	return ((is(element, 'flow:State') || is(element, 'flow:Related')) && !element.parent);
}


function canAttach(elements, target, source, position) {

	if (!Array.isArray(elements)) {
		elements = [elements];
	}

	// disallow appending as boundary event
	if (source) {
		return false;
	}

	// only (re-)attach one element at a time
	if (elements.length !== 1) {
		return false;
	}

	var element = elements[0];

	// do not attach labels
	if (isLabel(element)) {
		return false;
	}

	// only handle boundary events
	if (!isBoundaryCandidate(element)) {
		return false;
	}

	// allow default move operation
	if (!target) {
		return true;
	}


	// only attach to subprocess border
	if (position && !isBoundaryAttachment(position, target)) {
		return false;
	}

	return 'attach';
}


/**
 * Defines how to replace elements for a given target.
 *
 * Returns an array containing all elements which will be replaced.
 *
 * @example
 *
 *  [{ id: 'IntermediateEvent_2',
 *     type: 'flow:StartEvent'
 *   },
 *   { id: 'IntermediateEvent_5',
 *     type: 'flow:EndEvent'
 *   }]
 *
 * @param  {Array} elements
 * @param  {Object} target
 *
 * @return {Object} an object containing all elements which have to be replaced
 */
function canReplace(elements, target, position) {

	if (!target) {
		return false;
	}

	var canExecute = {
		replacements: []
	};

	return canExecute.replacements.length ? canExecute : false;
}

function canMove(elements, target) {

	// allow default move check to start move operation
	if (!target) {
		return true;
	}

	return elements.every(function (element) {
		return canDrop(element, target);
	});
}

function canCreate(shape, target, source, position) {

	if (!target) {
		return false;
	}

	if (isLabel(target)) {
		return null;
	}

	if (isSame(source, target)) {
		return false;
	}

	// ensure we do not drop the element
	// into source
	if (source && isParent(source, target)) {
		return false;
	}

	return canDrop(shape, target, position) || canInsert(shape, target, position);
}

function canResize(shape, newBounds) {
	return false;
}

function canInsert(shape, flow, position) {

	if (!flow) {
		return false;
	}

	if (Array.isArray(shape)) {
		if (shape.length !== 1) {
			return false;
		}

		shape = shape[0];
	}

	if (flow.source === shape ||
		flow.target === shape) {
		return false;
	}

	// return true iFlowFactorye can drop on the
	// underlying flow parent
	//
	// at this point we are not really able to talk
	// about connection rules (yet)

	return (
		isAny(flow, ['flow:SequenceFlow', 'flow:MessageFlow']) &&
		!isLabel(flow) &&
		is(shape, 'flow:FlowNode') &&
		!is(shape, 'flow:BoundaryEvent') &&
		canDrop(shape, flow.parent, position));
}

function contains(collection, element) {
	return (collection && element) && collection.indexOf(element) !== -1;
}

function canCopy(collection, element) {
	if (is(element, 'flow:Lane') && !contains(collection, element.parent)) {
		return false;
	}

	if (is(element, 'flow:BoundaryEvent') && !contains(collection, element.host)) {
		return false;
	}

	return true;
}
