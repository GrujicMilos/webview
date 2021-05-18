import { assign, isNumber, omit } from 'min-dash';
import { query as domQuery, remove as domRemove, domify } from 'min-dom';

import AutoPlaceModule from './features/auto-place';
import BendpointsModule from 'diagram-js/lib/features/bendpoints';
import ConnectModule from 'diagram-js/lib/features/connect'; // connect elements
import ConnectPreviewModule from 'diagram-js/lib/features/connection-preview';
import ContextModule from './features/context-pad';
import ContextPadModule from 'diagram-js/lib/features/context-pad'; // context pad for elements,
import CoreModule from './core';
import CreateModule from 'diagram-js/lib/features/create'; // create elements
import Diagram from 'diagram-js';
import EditorActionsModule from './features/editor-actions';
import FlowModdle from './moddle';
import LabelModule from './features/label-editing';
import LassoToolModule from 'diagram-js/lib/features/lasso-tool'; // lasso tool for element selection
import ModelingModule from './features/modeling';
import MoveCanvasModule from 'diagram-js/lib/navigation/movecanvas'; // scroll canvas
import MoveModule from 'diagram-js/lib/features/move'; // move shapes
import OutlineModule from 'diagram-js/lib/features/outline'; // show element outlines
import OverlaysModule from 'diagram-js/lib/features/overlays';
import PaletteModule from './features/palette';
import PropertiesPanelModule from './features/propertiesPanel';
import RulesModule from 'diagram-js/lib/features/rules'; // rules
import SelectionModule from 'diagram-js/lib/features/selection';
import SnappingModule from './features/snapping';
import TranslateModule from 'diagram-js/lib/i18n/translate';
import ZoomScrollModule from 'diagram-js/lib/navigation/zoomscroll'; // zoom canvas
import { importFlowDiagram } from './import/Importer';
import { innerSVG } from 'tiny-svg';

export default class Viewer {
	constructor(options) {
		this._modules = [
			AutoPlaceModule,
			BendpointsModule,
			ConnectModule,
			ConnectPreviewModule,
			ContextModule,
			ContextPadModule,
			CoreModule,
			CreateModule,
			EditorActionsModule,
			LabelModule,
			LassoToolModule,
			ModelingModule,
			MoveCanvasModule,
			MoveModule,
			OutlineModule,
			OverlaysModule,
			PaletteModule,
			PropertiesPanelModule,
			RulesModule,
			SelectionModule,
			SnappingModule,
			TranslateModule,
			ZoomScrollModule
		];

		this.DEFAULT_OPTIONS = {
			width: '100%',
			height: '100%',
			position: 'relative'
		};

		options = assign({}, this.DEFAULT_OPTIONS, options);

        this._adInsureOptions = options.adInsureOptions;

		this._moddle = this._createModdle(options);

		this._container = this._createContainer(options);

		this._init(this._container, this._moddle, options);
	}

	checkValidationError(err) {

		// check iFlowFactorye can help the user by indicating wrong Flow xml
		// (in case he or the exporting tool did not get that right)

		var pattern = /unparsable content <([^>]+)> detected([\s\S]*)$/;
		var match = pattern.exec(err.message);

		if (match) {
			err.message =
				'unparsable content <' + match[1] + '> detected; ' +
				'this may indicate an invalid Flow diagram file' + match[2];
		}

		return err;
	}

	ensureUnit(val) {
		return val + (isNumber(val) ? 'px' : '');
	}

	//	inherits(Viewer, Diagram);

	importJSON(doc, uiDoc, relationList, done) {
		// done is optional
		done = done || function () {
		};

		var self = this;

		this._moddle.fromJSON(doc, uiDoc, relationList, (err, definitions, context) => {

			var parseWarnings = context ? context.warnings : undefined;

			if (err) {
				err = this.checkValidationError(err);

				self._emit('import.done', { error: err, warnings: parseWarnings });

				return done(err, parseWarnings);
			}
			self.importDefinitions(definitions, function (err, importWarnings) {
				var allWarnings = [].concat(parseWarnings, importWarnings || []);

				self._emit('import.done', { error: err, warnings: allWarnings });

				done(err, allWarnings);
			});
		});

	};

	saveJSON(options, done) {
		if (!done) {
			done = options;
			options = {};
		}

		var definitions = this._definitions;

		if (!definitions) {
			return done(new Error('no definitions loaded'));
		}
		var canvas = this.get('canvas');

		var rootChildren = canvas._rootElement.children;

		this._moddle.toJSON(definitions, rootChildren, options, function (err, xml) {
			done(err, xml);
		});
	};

	saveSVG(options, done) {
		if (!done) {
			done = options;
			options = {};
		}

		this._emit('saveSVG.start');

		var svg, err;

		try {
			var canvas = this.get('canvas');

			var contentNode = canvas.getDefaultLayer(),
				defsNode = domQuery('defs', canvas._svg);

			var contents = innerSVG(contentNode),
				defs = defsNode ? '<defs>' + innerSVG(defsNode) + '</defs>' : '';

			var bbox = contentNode.getBBox();

			svg =
				'<?xml version="1.0" encoding="utf-8"?>\n' +
				'<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
				'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
				'width="' + bbox.width + '" height="' + '700' + '" ' +
				'viewBox="' + bbox.x + ' ' + bbox.y + ' ' + bbox.width + ' ' + bbox.height + '" version="1.1">' +
				defs + contents +
				'</svg>';
		} catch (e) {
			err = e;
		}

		this._emit('saveSVG.done', {
			error: err,
			svg: svg
		});

		done(err, svg);
	};

	importDefinitions(definitions, done) {
		// catch synchronous exceptions during #clear()
		try {
			if (this._definitions) {
				// clear existing rendered diagram
				this.clear();
			}

			// update definitions
			this._definitions = definitions;
		} catch (e) {
			return done(e);
		}

		// perform graphical import
		return importFlowDiagram(this, definitions, done);
	};


	getModules() {
		return this._modules;
	};

	/**
	 * Destroy the viewer instance and remove all its
	 * remainders from the document tree.
	 */
	destroy() {

		// diagram destroy
		Diagram.prototype.destroy.call(this);

		// dom detach
		domRemove(this._container);
	};

	/**
 * Register an event listener
 *
 * Remove a previously added listener via {@link #off(event, callback)}.
 *
 * @param {String} event
 * @param {Number} [priority]
 * @param {Function} callback
 * @param {Object} [that]
 */
	on(event, priority, callback, target) {
		return this.get('eventBus').on(event, priority, callback, target);
	};

	/**
	 * De-register an event listener
	 *
	 * @param {String} event
	 * @param {Function} callback
	 */
	off(event, callback) {
		this.get('eventBus').off(event, callback);
	};

	attachTo(parentNode) {

		if (!parentNode) {
			throw new Error('parentNode required');
		}

		// ensure we detach from the previous, old parent
		this.detach();

		// unwrap jQuery if provided
		if (parentNode.get && parentNode.constructor.prototype.jquery) {
			parentNode = parentNode.get(0);
		}

		if (typeof parentNode === 'string') {
			parentNode = domQuery(parentNode);
		}

		parentNode.appendChild(this._container);

		this._emit('attach', {});

		this.get('canvas').resized();
	};

	getDefinitions() {
		return this._definitions;
	};

	detach() {

		var container = this._container,
			parentNode = container.parentNode;

		if (!parentNode) {
			return;
		}

		this._emit('detach', {});

		parentNode.removeChild(container);
	};

	_init(container, moddle, options) {

		var baseModules = options.modules || this.getModules(),
			additionalModules = options.additionalModules || [],
			staticModules = [
				{
					flowjs: ['value', this],
					moddle: ['value', moddle]
				}
			];

		var diagramModules = [].concat(staticModules, baseModules, additionalModules);

		var diagramOptions = assign(omit(options, ['additionalModules']), {
			canvas: assign({}, options.canvas, { container: container }),
			modules: diagramModules
		});

		// invoke diagram constructor
		Diagram.call(this, diagramOptions);

        const contextPadProvider = this.get('contextPadProvider');
        if (contextPadProvider) {
            contextPadProvider._adInsureOptions = this._adInsureOptions;
        }

		if (options && options.container) {
			this.attachTo(options.container);
		}
	};

	/**
	 * Emit an event on the underlying {@link EventBus}
	 *
	 * @param  {String} type
	 * @param  {Object} event

	 * @return {Object} event processing result (if any)
	 */
	_emit(type, event) {
		return this.get('eventBus').fire(type, event);
	};

	_createContainer(options) {

		var container = domify('<div class="bjs-container"></div>');

		assign(container.style, {
			width: this.ensureUnit(options.width),
			height: this.ensureUnit(options.height),
			position: options.position
		});

		return container;
	};

	_createModdle(options) {
		var moddleOptions = assign({}, this._moddleExtensions, options.moddleExtensions);

		return new FlowModdle(moddleOptions);
	};
}
