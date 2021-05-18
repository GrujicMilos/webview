import { assign, isObject } from 'min-dash';
import { getCirclePath, getFillColor, getRectPath, getRoundRectPath, getSemantic, getStrokeColor } from './FlowRenderUtil';
import { append as svgAppend, attr as svgAttr, classes as svgClasses, create as svgCreate } from 'tiny-svg';

import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';
import Ids from 'ids';
import { createLine } from 'diagram-js/lib/util/RenderUtil';
import { query as domQuery } from 'min-dom';
import inherits from 'inherits';
import { is } from '../util/ModelUtil';

var RENDERER_IDS = new Ids();

var RELATED_BORDER_RADIUS = 10;

var DEFAULT_FILL_OPACITY = 0.90;

export default function FlowRenderer(
	config, eventBus, styles,
	canvas, textRenderer, priority) {

	BaseRenderer.call(this, eventBus, priority);
	var defaultFillColor = config && config.defaultFillColor,
		defaultStrokeColor = config && config.defaultStrokeColor;

	var rendererId = RENDERER_IDS.next();

	var markers = {};

	var computeStyle = styles.computeStyle;

	function addMarker(id, options) {
		var attrs = assign({
			fill: 'black',
			strokeWidth: 1,
			strokeLinecap: 'round',
			strokeDasharray: 'none'
		}, options.attrs);

		var ref = options.ref || { x: 0, y: 0 };

		var scale = options.scale || 1;

		// fix for safari / chrome / firefox bug not correctly
		// resetting stroke dash array
		if (attrs.strokeDasharray === 'none') {
			attrs.strokeDasharray = [10000, 1];
		}

		var marker = svgCreate('marker');

		svgAttr(options.element, attrs);

		svgAppend(marker, options.element);

		svgAttr(marker, {
			id: id,
			viewBox: '0 0 20 20',
			refX: ref.x,
			refY: ref.y,
			markerWidth: 20 * scale,
			markerHeight: 20 * scale,
			orient: 'auto'
		});

		var defs = domQuery('defs', canvas._svg);

		if (!defs) {
			defs = svgCreate('defs');

			svgAppend(canvas._svg, defs);
		}

		svgAppend(defs, marker);

		markers[id] = marker;
	}

	function marker(type, fill, stroke) {
		var id = type + '-' + fill + '-' + stroke + '-' + rendererId;

		if (!markers[id]) {
			createMarker(type, fill, stroke);
		}

		return 'url(#' + id + ')';
	}

	function createMarker(type, fill, stroke) {
		console.log('create marker', type);
		var id = type + '-' + fill + '-' + stroke + '-' + rendererId;

		if (type === 'association-end') {
			var sequenceflowEnd = svgCreate('path');
			svgAttr(sequenceflowEnd, { d: 'M 1 5 L 11 10 L 1 15 Z' });

			addMarker(id, {
				element: sequenceflowEnd,
				ref: { x: 11, y: 10 },
				scale: 0.5,
				attrs: {
					fill: stroke,
					stroke: stroke
				}
			});
		}

		if (type === 'messageflow-start') {
			var messageflowStart = svgCreate('circle');
			svgAttr(messageflowStart, { cx: 6, cy: 6, r: 3.5 });

			addMarker(id, {
				element: messageflowStart,
				attrs: {
					fill: fill,
					stroke: stroke
				},
				ref: { x: 6, y: 6 }
			});
		}

		if (type === 'messageflow-end') {
			var messageflowEnd = svgCreate('path');
			svgAttr(messageflowEnd, { d: 'm 1 5 l 0 -3 l 7 3 l -7 3 z' });

			addMarker(id, {
				element: messageflowEnd,
				attrs: {
					fill: fill,
					stroke: stroke,
					strokeLinecap: 'butt'
				},
				ref: { x: 8.5, y: 5 }
			});
		}

		if (type === 'association-start') {
			var associationStart = svgCreate('path');
			svgAttr(associationStart, { d: 'M 11 5 L 1 10 L 11 15' });

			addMarker(id, {
				element: associationStart,
				attrs: {
					fill: 'none',
					stroke: stroke,
					strokeWidth: 1.5
				},
				ref: { x: 1, y: 10 },
				scale: 0.5
			});
		}

		if (type === 'association-end') {
			var associationEnd = svgCreate('path');
			svgAttr(associationEnd, { d: 'M 1 5 L 11 10 L 1 15' });

			addMarker(id, {
				element: associationEnd,
				attrs: {
					fill: 'none',
					stroke: stroke,
					strokeWidth: 1.5
				},
				ref: { x: 12, y: 10 },
				scale: 0.5
			});
		}

		if (type === 'conditional-flow-marker') {
			var conditionalflowMarker = svgCreate('path');
			svgAttr(conditionalflowMarker, { d: 'M 0 10 L 8 6 L 16 10 L 8 14 Z' });

			addMarker(id, {
				element: conditionalflowMarker,
				attrs: {
					fill: fill,
					stroke: stroke
				},
				ref: { x: -1, y: 10 },
				scale: 0.5
			});
		}

		if (type === 'conditional-default-flow-marker') {
			var conditionaldefaultflowMarker = svgCreate('path');
			svgAttr(conditionaldefaultflowMarker, { d: 'M 6 4 L 10 16' });

			addMarker(id, {
				element: conditionaldefaultflowMarker,
				attrs: {
					stroke: stroke
				},
				ref: { x: 0, y: 10 },
				scale: 0.5
			});
		}
	}

	function drawCircle(parentGfx, width, height, offset, attrs) {

		if (isObject(offset)) {
			attrs = offset;
			offset = 0;
		}

		offset = offset || 0;

		attrs = computeStyle(attrs, {
			stroke: 'black',
			strokeWidth: 2,
			fill: 'transparent'
		});

		if (attrs.fill === 'none') {
			delete attrs.fillOpacity;
		}

		var cx = width / 2,
			cy = height / 2;

		var circle = svgCreate('circle');
		svgAttr(circle, {
			cx: cx,
			cy: cy,
			r: Math.round((width + height) / 4 - offset)
		});
		svgAttr(circle, attrs);

		svgAppend(parentGfx, circle);

		return circle;
	}

	function drawRect(parentGfx, width, height, r, offset, attrs) {

		if (isObject(offset)) {
			attrs = offset;
			offset = 0;
		}

		offset = offset || 0;

		attrs = computeStyle(attrs, {
			stroke: 'black',
			strokeWidth: 2,
			fill: 'white'
		});

		var rect = svgCreate('rect');
		svgAttr(rect, {
			x: offset,
			y: offset,
			width: width - offset * 2,
			height: height - offset * 2,
			rx: r,
			ry: r
		});
		svgAttr(rect, attrs);

		svgAppend(parentGfx, rect);

		return rect;
	}

	function drawLine(parentGfx, waypoints, attrs) {
		attrs = computeStyle(attrs, ['no-fill'], {
			stroke: 'black',
			strokeWidth: 2,
			fill: 'none'
		});

		var line = createLine(waypoints, attrs);

		svgAppend(parentGfx, line);

		return line;
	}

	function drawPath(parentGfx, d, attrs) {

		attrs = computeStyle(attrs, ['no-fill'], {
			strokeWidth: 2,
			stroke: 'black'
		});

		var path = svgCreate('path');
		svgAttr(path, { d: d });
		svgAttr(path, attrs);

		svgAppend(parentGfx, path);

		return path;
	}

	function renderLabel(parentGfx, label, options) {

		options = assign({
			size: {
				width: 100
			}
		}, options);

		var text = textRenderer.createText(label || '', options);

		svgClasses(text).add('djs-label');

		svgAppend(parentGfx, text);

		return text;
	}

	function renderExternalLabel(parentGfx, element) {
		var semantic = getSemantic(element);
		var box = {
			width: 180,
			height: 30,
			x: element.width / 2 + element.x,
			y: element.height / 2 + element.y
		};

		return renderLabel(parentGfx, semantic.name, {
			box: box,
			fitBox: true,
			align: 'center-middle',
			style: assign(
				{},
				semantic.$type === 'flow:Relationship' ? textRenderer.getExternalRelationshipStyle() : textRenderer.getExternalStyle(),
				{
					fill: getStrokeColor(element, defaultStrokeColor)
				}
			)
		});
	}

	var handlers = this.handlers = {
		'flow:State': function (parentGfx, element) {

			var attrs = {
				fill: getFillColor(element, defaultFillColor),
				stroke: getStrokeColor(element, defaultStrokeColor)
			};

			if (!('fillOpacity' in attrs)) {
				attrs.fillOpacity = DEFAULT_FILL_OPACITY;
			}

			var circle = drawCircle(parentGfx, element.width, element.height, attrs);

			return circle;
		},

		'flow:Related': function (parentGfx, element) {
			var attrs = {
				fill: getFillColor(element, defaultFillColor),
				stroke: getStrokeColor(element, defaultStrokeColor)
			};
			if (!('fillOpacity' in attrs)) {
				attrs.fillOpacity = DEFAULT_FILL_OPACITY;
			}

			var rect = drawRect(parentGfx, element.width, element.height, RELATED_BORDER_RADIUS, attrs);

			renderEmbeddedLabel(parentGfx, element, 'center-middle');

			return rect;
		},

		'flow:Relationship': function (parentGfx, element, attrs) {

			var semantic = getSemantic(element);

			var fill = getFillColor(element, defaultFillColor),
				stroke = getStrokeColor(element, defaultStrokeColor);

			attrs = assign({
				strokeLinecap: 'round',
				strokeLinejoin: 'round',
				stroke: getStrokeColor(element, defaultStrokeColor) //'#'+Math.floor(Math.random()*16777215).toString(16), //
			}, attrs || {});

			if (semantic.direction === 'Forward' ||
				semantic.direction === 'Both') {
				attrs.markerEnd = marker('association-end', fill, stroke);
			}

			if (semantic.direction === 'Both') {
				attrs.markerStart = marker('association-start', fill, stroke);
			}

			if (element.type === 'flow:Relationship' && semantic.direction === undefined) {
				attrs.markerEnd = marker('association-end', fill, stroke);
			}

			return drawLine(parentGfx, element.waypoints, attrs);
		},
		'label': function (parentGfx, element) {
			return renderExternalLabel(parentGfx, element);
		},

	};

	function renderEmbeddedLabel(parentGfx, element, align) {
		var semantic = getSemantic(element);

		return renderLabel(parentGfx, semantic.name, {
			box: element,
			align: align,
			padding: 5,
			style: {
				fill: getStrokeColor(element, defaultStrokeColor)
			}
		});
	}

	// extension API, use at your own risk
	this._drawPath = drawPath;

}


inherits(FlowRenderer, BaseRenderer);

FlowRenderer.$inject = [
	'config.flowRenderer',
	'eventBus',
	'styles',
	'canvas',
	'textRenderer'
];

FlowRenderer.prototype.canRender = function (element) {
	return is(element, 'flow:BaseElement');
};

FlowRenderer.prototype.drawShape = function (parentGfx, element) {
	var type = element.type;
	var h = this.handlers[type];

	/* jshint -W040 */
	return h(parentGfx, element);
};

FlowRenderer.prototype.drawConnection = function (parentGfx, element) {
	var type = element.type;
	var h = this.handlers[type];

	/* jshint -W040 */
	return h(parentGfx, element);
};

FlowRenderer.prototype.getShapePath = function (element) {

	if (is(element, 'flow:State')) {
		return getCirclePath(element);
	}
	if (is(element, 'flow:Related')) {
		return getRoundRectPath(element, RELATED_BORDER_RADIUS);
	}

	return getRectPath(element);
};
