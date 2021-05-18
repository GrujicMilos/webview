import BaseElementFactory from 'diagram-js/lib/core/ElementFactory';
import inherits from 'inherits';
import { assign, forEach } from 'min-dash';
import { DEFAULT_LABEL_SIZE } from '../../util/LabelUtil';
import { is } from '../../util/ModelUtil';

/**
 * A flow-aware factory for diagram-js shapes
 */
export default function ElementFactory(flowFactory, moddle, translate) {
	BaseElementFactory.call(this);

	this._flowFactory = flowFactory;
	this._moddle = moddle;
	this._translate = translate;
}

inherits(ElementFactory, BaseElementFactory);

ElementFactory.$inject = [
	'flowFactory',
	'moddle',
	'translate'
];

ElementFactory.prototype.baseCreate = BaseElementFactory.prototype.create;

ElementFactory.prototype.create = function (elementType, attrs) {
	// no special magic for labels,
	// we assume their businessObjects have already been created
	// and wired via attrs
	if (elementType === 'label') {
		return this.baseCreate(elementType, assign({type: 'label'}, DEFAULT_LABEL_SIZE, attrs));
	}

	return this.createFlowElement(elementType, attrs);
};

ElementFactory.prototype.createFlowElement = function (elementType, attrs) {
	var size,
		translate = this._translate;

	attrs = attrs || {};

	var businessObject = attrs.businessObject;

	if (!businessObject) {
		if (!attrs.type) {
			throw new Error(translate('no shape type specified'));
		}

		businessObject = this._flowFactory.create(attrs.type);
	}

	if (!businessObject.di) {
		if (elementType === 'root') {
			businessObject.di = this._flowFactory.createDiPlane(businessObject, [], {
				id: businessObject.id + '_di'
			});
		} else if (elementType === 'connection') {
			businessObject.di = this._flowFactory.createDiEdge(businessObject, [], {
				id: businessObject.id + '_di'
			});
		} else {
			businessObject.di = this._flowFactory.createDiShape(businessObject, {}, {
				id: businessObject.id + '_di'
			});
		}
	}

	if (attrs.colors) {
		assign(businessObject.di, attrs.colors);

		delete attrs.colors;
	}

	applyAttributes(businessObject, attrs, [
		'processRef',
		'isInterrupting',
		'direction',
		'isForCompensation'
	]);

	if (is(businessObject, 'flow:ExclusiveGateway')) {
		businessObject.di.isMarkerVisible = true;
	}

	size = this._getDefaultSize(businessObject);

	attrs = assign({
		businessObject: businessObject,
		id: businessObject.id
	}, size, attrs);

	return this.baseCreate(elementType, attrs);
};


ElementFactory.prototype._getDefaultSize = function (semantic) {

	if (is(semantic, 'flow:State')) {
		return {width: 36, height: 36};
	}

	return {width: 100, height: 80};
};


// helpers //////////////////////

/**
 * Apply attributes from a map to the given element,
 * remove attribute from the map on application.
 *
 * @param {Base} element
 * @param {Object} attrs (in/out map of attributes)
 * @param {Array<String>} attributeNames name of attributes to apply
 */
function applyAttributes(element, attrs, attributeNames) {

	forEach(attributeNames, function (property) {
		if (attrs[property] !== undefined) {
			applyAttribute(element, attrs, property);
		}
	});
}

/**
 * Apply named property to element and drain it from the attrs
 * collection.
 *
 * @param {Base} element
 * @param {Object} attrs (in/out map of attributes)
 * @param {String} attributeName to apply
 */
function applyAttribute(element, attrs, attributeName) {
	element[attributeName] = attrs[attributeName];

	delete attrs[attributeName];
}
