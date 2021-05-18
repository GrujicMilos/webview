import { assign } from 'min-dash';
import { getExternalLabelMid, hasExternalLabel, isLabel, isLabelExternal } from '../../util/LabelUtil';
import { isAny } from '../modeling/util/ModelingUtil';
import { getLabel } from './LabelUtil';

export default function LabelEditingProvider(
	eventBus, canvas, directEditing,
	modeling, resizeHandles, textRenderer) {

	this._canvas = canvas;
	this._modeling = modeling;
	this._textRenderer = textRenderer;

	directEditing.registerProvider(this);

	// listen to dblclick on non-root elements
	eventBus.on('element.dblclick', function (event) {
		activateDirectEdit(event.element, true);
	});

	// complete on followup canvas operation
	eventBus.on([
		'element.mousedown',
		'drag.init',
		'canvas.viewbox.changing',
		'autoPlace',
		'popupMenu.open'
	], function (event) {

		if (directEditing.isActive()) {
			directEditing.complete();
		}
	});

	// cancel on command stack changes
	eventBus.on(['commandStack.changed'], function (e) {
		if (directEditing.isActive()) {
			directEditing.cancel();
		}
	});


	eventBus.on('directEditing.activate', function (event) {
		resizeHandles.removeResizers();
	});

	eventBus.on('create.end', 500, function (event) {

		var element = event.shape,
			canExecute = event.context.canExecute,
			isTouch = event.isTouch;

		if (isTouch) {
			return;
		}

		if (!canExecute) {
			return;
		}

		activateDirectEdit(element);
	});

	eventBus.on('autoPlace.end', 500, function (event) {
		activateDirectEdit(event.shape);
	});


	function activateDirectEdit(element, force) {
		console.log('activate direct edit', element, force);
		if ((force ||
			isAny(element, ['flow:State', 'flow:Relationship', 'flow:Related'])) && isRelatedRelationship(element)) {
			directEditing.activate(element);
		}
	}

	// for Relationship between States and Relateds shapes, label is not necessary
	function isRelatedRelationship(element) {
		if (
			isAny(element, ['flow:Relationship']) && element.businessObject.target.$type === 'flow:Related') {
			return false;
		}
		else {
			return true;
		}
	}

}

LabelEditingProvider.$inject = [
	'eventBus',
	'canvas',
	'directEditing',
	'modeling',
	'resizeHandles',
	'textRenderer'
];


/**
 * Activate direct editing for activities and text annotations.
 *
 * @param  {djs.model.Base} element
 *
 * @return {Object} an object with properties bounds (position and size), text and options
 */
LabelEditingProvider.prototype.activate = function (element) {

	// text
	var text = getLabel(element);

	if (text === undefined) {
		return;
	}

	var context = {
		text: text
	};

	// bounds
	var bounds = this.getEditingBBox(element);

	assign(context, bounds);

	var options = {};

	// tasks
	if (
		isAny(element, [
			'flow:State',
			'flow:Relationship',
			'flow:Related'
		])) {
		assign(options, {
			centerVertically: true
		});
	}

	// external labels
	if (isLabelExternal(element)) {
		assign(options, {
			autoResize: true
		});
	}

	assign(context, {
		options: options
	});

	return context;
};


/**
 * Get the editing bounding box based on the element's size and position
 *
 * @param  {djs.model.Base} element
 *
 * @return {Object} an object containing information about position
 *                  and size (fixed or minimum and/or maximum)
 */
LabelEditingProvider.prototype.getEditingBBox = function (element) {
	var canvas = this._canvas;

	var target = element.label || element;

	var bbox = canvas.getAbsoluteBBox(target);

	var mid = {
		x: bbox.x + bbox.width / 2,
		y: bbox.y + bbox.height / 2
	};

	// default position
	var bounds = { x: bbox.x, y: bbox.y };

	var zoom = canvas.zoom();

	var defaultStyle = this._textRenderer.getDefaultStyle(),
		externalStyle = this._textRenderer.getExternalStyle();

	// take zoom into account
	var externalFontSize = externalStyle.fontSize * zoom,
		externalLineHeight = externalStyle.lineHeight,
		defaultFontSize = defaultStyle.fontSize * zoom,
		defaultLineHeight = defaultStyle.lineHeight;

	var style = {
		fontFamily: this._textRenderer.getDefaultStyle().fontFamily,
		fontWeight: this._textRenderer.getDefaultStyle().fontWeight
	};


	var width = 180 * zoom,
		paddingTop = 7 * zoom,
		paddingBottom = 4 * zoom;

	// external labels for events, data elements, gateways and connections
	if (target.labelTarget) {
		assign(bounds, {
			width: width,
			height: bbox.height + paddingTop + paddingBottom,
			x: mid.x - width / 2,
			y: bbox.y - paddingTop
		});

		assign(style, {
			fontSize: externalFontSize + 'px',
			lineHeight: externalLineHeight,
			paddingTop: paddingTop + 'px',
			paddingBottom: paddingBottom + 'px'
		});
	}

	if (isAny(element, ['flow:Related'])) {
		assign(bounds, {
			width: bbox.width,
			height: bbox.height
		});

		assign(style, {
			fontSize: defaultFontSize + 'px',
			lineHeight: defaultLineHeight,
			paddingTop: (7 * zoom) + 'px',
			paddingBottom: (7 * zoom) + 'px',
			paddingLeft: (5 * zoom) + 'px',
			paddingRight: (5 * zoom) + 'px'
		});
	}

	// external label not yet created
	if (isLabelExternal(target)
		&& !hasExternalLabel(target)
		&& !isLabel(target)) {

		var externalLabelMid = getExternalLabelMid(element);

		var absoluteBBox = canvas.getAbsoluteBBox({
			x: externalLabelMid.x,
			y: externalLabelMid.y,
			width: 0,
			height: 0
		});

		var height = externalFontSize + paddingTop + paddingBottom;

		assign(bounds, {
			width: width,
			height: height,
			x: absoluteBBox.x - width / 2,
			y: absoluteBBox.y - height / 2
		});

		assign(style, {
			fontSize: externalFontSize + 'px',
			lineHeight: externalLineHeight,
			paddingTop: paddingTop + 'px',
			paddingBottom: paddingBottom + 'px'
		});
	}

	return { bounds: bounds, style: style };
};


LabelEditingProvider.prototype.update = function (
	element, newLabel) {

	if (isEmptyText(newLabel)) {
		newLabel = null;
	}
	const type = element.businessObject.$type.split(':');
	if (newLabel) {
		if (!checkIsPascalCase(newLabel)) {
			throw new Error(`Inserted '${type[1]}' name '${newLabel}' should be pascalCase`);
		} else {
			// if inserted elements with same type, name and different id exist , function should throw error
			if (this._canvas && this._canvas._rootElement && this._canvas._rootElement.children &&
				this._canvas._rootElement.children.findIndex(n => n.businessObject.name === newLabel && n.type === element.type && n.id !== element.id) === -1) {
				this._modeling.updateLabel(element, newLabel);
			} else {

				throw new Error(`'${type[1]}' with '${newLabel}' name already exist`);
			}
		}

	} else {
		throw new Error(`'${type[1]}' name is mandatory.`);
	}
};


// helpers //////////////////////

function isEmptyText(label) {
	return !label || !label.trim();
}

function checkIsPascalCase(shapeName) {
	const regexp = new RegExp('^(_*[A-Z]+[a-z0-9]+)');
	return regexp.test(shapeName);
}
