import { assign, map } from 'min-dash';
import { getExternalLabelBounds, isLabelExternal } from '../util/LabelUtil';
import { is } from '../util/ModelUtil';
import { elementToString } from './Util';

function elementData(semantic, attrs) {
	return assign({
		id: semantic.id,
		type: semantic.$type,
		businessObject: semantic
	}, attrs);
}

function collectWaypoints(waypoints) {
	return map(waypoints, function (p) {
		return { x: p.x, y: p.y };
	});
}

function notYetDrawn(translate, semantic, refSemantic, property) {
	return new Error(translate('element {element} referenced by {referenced}#{property} not yet drawn', {
		element: elementToString(refSemantic),
		referenced: elementToString(semantic),
		property: property
	}));
}


/**
 * An importer that adds flow elements to the canvas
 *
 * @param {EventBus} eventBus
 * @param {Canvas} canvas
 * @param {ElementFactory} elementFactory
 * @param {ElementRegistry} elementRegistry
 * @param {Function} translate
 * @param {TextRenderer} textRenderer
 */
export default function FlowImporter(
	eventBus, canvas, elementFactory,
	elementRegistry, translate, textRenderer) {

	this._eventBus = eventBus;
	this._canvas = canvas;
	this._elementFactory = elementFactory;
	this._elementRegistry = elementRegistry;
	this._translate = translate;
	this._textRenderer = textRenderer;
}

FlowImporter.$inject = [
	'eventBus',
	'canvas',
	'elementFactory',
	'elementRegistry',
	'translate',
	'textRenderer'
];


/**
 * Add flow element (semantic) to the canvas onto the
 * specified parent shape.
 */
FlowImporter.prototype.add = function (semantic, parentElement) {

	var di = semantic.di,
		element,
		translate = this._translate,
		hidden;

	var parentIndex;

	// ROOT ELEMENT
	// handle the special case that we deal with a
	// invisible root element (process or collaboration)
	if (is(di, 'flowdi:FLOWPlane')) {

		// add a virtual element (not being drawn)
		var a = elementData(semantic);
		element = this._elementFactory.createRoot(a);

		this._canvas.setRootElement(element);
	}

	// SHAPE
	else if (is(di, 'flowdi:FLOWShape')) {

		hidden = parentElement && (parentElement.hidden || parentElement.collapsed);

		var bounds = semantic.di.bounds;

		element = this._elementFactory.createShape(elementData(semantic, {
			collapsed: false,
			hidden: hidden,
			x: Math.round(bounds.x),
			y: Math.round(bounds.y),
			width: Math.round(bounds.width),
			height: Math.round(bounds.height)
		}));

		this._canvas.addShape(element, parentElement, parentIndex);
	}

	// CONNECTION
	else if (is(di, 'flowdi:FLOWEdge')) {

		var source = this._getSource(semantic),
			target = this._getTarget(semantic);

		hidden = parentElement && (parentElement.hidden || parentElement.collapsed);

		element = this._elementFactory.createConnection(elementData(semantic, {
			hidden: hidden,
			source: source,
			target: target,
			waypoints: collectWaypoints(semantic.di.waypoint)
		}));

		// insert sequence flows behind other flow nodes (cf. #727)
		if (is(semantic, 'flow:Relationship')) {
			parentIndex = 0;
		}
		this._canvas.addConnection(element, parentElement, parentIndex);
	} else {
		throw new Error(translate('unknown di {di} for element {semantic}', {
			di: elementToString(di),
			semantic: elementToString(semantic)
		}));
	}
	// (optional) LABEL
	if (isLabelExternal(semantic) && semantic.name) {
		this.addLabel(semantic, element);
	}


	this._eventBus.fire('flowElement.added', { element: element });

	return element;
};


/**
 * add label for an element
 */
FlowImporter.prototype.addLabel = function (semantic, element) {
	var bounds,
		text,
		label;

	bounds = getExternalLabelBounds(semantic, element);

	text = semantic.name;

	if (text) {
		// get corrected bounds from actual layouted text
		bounds = this._textRenderer.getExternalLabelBounds(bounds, text);
	}

	label = this._elementFactory.createLabel(elementData(semantic, {
		id: semantic.id + '_label',
		labelTarget: element,
		type: 'label',
		hidden: element.hidden || !semantic.name,
		x: Math.round(bounds.x),
		y: Math.round(bounds.y),
		width: Math.round(bounds.width),
		height: Math.round(bounds.height)
	}));

	return this._canvas.addShape(label, element.parent);
};

/**
 * Return the drawn connection end based on the given side.
 *
 * @throws {Error} if the end is not yet drawn
 */
FlowImporter.prototype._getEnd = function (semantic, side) {

	var element,
		refSemantic,
		translate = this._translate;

	refSemantic = semantic[side];
	element = refSemantic && this._getElement(refSemantic);
	if (element) {
		return element;
	}

	if (refSemantic) {
		throw notYetDrawn(translate, semantic, refSemantic, side + 'Ref');
	} else {
		throw new Error(translate('{semantic}#{side} Ref not specified', {
			semantic: elementToString(semantic),
			side: side
		}));
	}
};

FlowImporter.prototype._getSource = function (semantic) {
	return this._getEnd(semantic, 'source');
};

FlowImporter.prototype._getTarget = function (semantic) {
	return this._getEnd(semantic, 'target');
};


FlowImporter.prototype._getElement = function (semantic) {
	return this._elementRegistry.get(semantic.id);
};
