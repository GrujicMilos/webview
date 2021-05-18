import BaseModeling from 'diagram-js/lib/features/modeling/Modeling';
import inherits from 'inherits';
import UpdateLabelHandler from '../label-editing/cmd/UpdateLabelHandler';
import AddLaneHandler from './cmd/AddLaneHandler';
import IdClaimHandler from './cmd/IdClaimHandler';
import ResizeLaneHandler from './cmd/ResizeLaneHandler';
import SetColorHandler from './cmd/SetColorHandler';
import SplitLaneHandler from './cmd/SplitLaneHandler';
import UpdateCanvasRootHandler from './cmd/UpdateCanvasRootHandler';
import UpdateFlowNodeRefsHandler from './cmd/UpdateFlowNodeRefsHandler';
import UpdatePropertiesHandler from './cmd/UpdatePropertiesHandler';

/**
 * Flow modeling features activator
 *
 * @param {EventBus} eventBus
 * @param {ElementFactory} elementFactory
 * @param {CommandStack} commandStack
 * @param {flowRules} flowRules
 */
export default function Modeling(
	eventBus, elementFactory, commandStack,
	flowRules) {

	BaseModeling.call(this, eventBus, elementFactory, commandStack);

	this._flowRules = flowRules;
}

inherits(Modeling, BaseModeling);

Modeling.$inject = [
	'eventBus',
	'elementFactory',
	'commandStack',
	'flowRules'
];


Modeling.prototype.getHandlers = function () {
	var handlers = BaseModeling.prototype.getHandlers.call(this);

	handlers['element.updateProperties'] = UpdatePropertiesHandler;
	handlers['canvas.updateRoot'] = UpdateCanvasRootHandler;
	handlers['lane.add'] = AddLaneHandler;
	handlers['lane.resize'] = ResizeLaneHandler;
	handlers['lane.split'] = SplitLaneHandler;
	handlers['lane.updateRefs'] = UpdateFlowNodeRefsHandler;
	handlers['id.updateClaim'] = IdClaimHandler;
	handlers['element.setColor'] = SetColorHandler;
	handlers['element.updateLabel'] = UpdateLabelHandler;

	return handlers;
};


Modeling.prototype.updateLabel = function (element, newLabel, newBounds, hints) {
	this._commandStack.execute('element.updateLabel', {
		element: element,
		newLabel: newLabel,
		newBounds: newBounds,
		hints: hints || {}
	});
};


Modeling.prototype.connect = function (source, target, attrs, hints) {

	var flowRules = this._flowRules;

	if (!attrs) {
		attrs = flowRules.canConnect(source, target);
	}

	if (!attrs) {
		return;
	}

	return this.createConnection(source, target, attrs, source.parent, hints);
};


Modeling.prototype.updateProperties = function (element, properties) {
	this._commandStack.execute('element.updateProperties', {
		element: element,
		properties: properties
	});
};

Modeling.prototype.resizeLane = function (laneShape, newBounds, balanced) {
	this._commandStack.execute('lane.resize', {
		shape: laneShape,
		newBounds: newBounds,
		balanced: balanced
	});
};

Modeling.prototype.addLane = function (targetLaneShape, location) {
	var context = {
		shape: targetLaneShape,
		location: location
	};

	this._commandStack.execute('lane.add', context);

	return context.newLane;
};

Modeling.prototype.splitLane = function (targetLane, count) {
	this._commandStack.execute('lane.split', {
		shape: targetLane,
		count: count
	});
};

/**
 * Transform the current diagram into a collaboration.
 *
 * @return {djs.model.Root} the new root element
 */
Modeling.prototype.makeCollaboration = function () {

	var collaborationElement = this._create('root', {
		type: 'flow:Collaboration'
	});

	var context = {
		newRoot: collaborationElement
	};

	this._commandStack.execute('canvas.updateRoot', context);

	return collaborationElement;
};

Modeling.prototype.updateLaneRefs = function (flowNodeShapes, laneShapes) {

	this._commandStack.execute('lane.updateRefs', {
		flowNodeShapes: flowNodeShapes,
		laneShapes: laneShapes
	});
};

/**
 * Transform the current diagram into a process.
 *
 * @return {djs.model.Root} the new root element
 */
Modeling.prototype.makeProcess = function () {

	var processElement = this._create('root', {
		type: 'flow:State'
	});

	var context = {
		newRoot: processElement
	};

	this._commandStack.execute('canvas.updateRoot', context);
};


Modeling.prototype.claimId = function (id, moddleElement) {
	this._commandStack.execute('id.updateClaim', {
		id: id,
		element: moddleElement,
		claiming: true
	});
};


Modeling.prototype.unclaimId = function (id, moddleElement) {
	this._commandStack.execute('id.updateClaim', {
		id: id,
		element: moddleElement
	});
};

Modeling.prototype.setColor = function (elements, colors) {
	if (!elements.length) {
		elements = [elements];
	}

	this._commandStack.execute('element.setColor', {
		elements: elements,
		colors: colors
	});
};