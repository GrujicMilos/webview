import { assign } from 'min-dash';

/**
 * A palette provider for Flow elements.
 */
export default function PaletteProvider(
	palette, create, elementFactory,
	spaceTool, lassoTool, handTool,
	globalConnect, translate, config) {

	this._palette = palette;
	this._create = create;
	this._elementFactory = elementFactory;
	this._spaceTool = spaceTool;
	this._lassoTool = lassoTool;
	this._handTool = handTool;
	this._globalConnect = globalConnect;
	this._translate = translate;
	this._config = config;

	palette.registerProvider(this);
}

PaletteProvider.$inject = [
	'palette',
	'create',
	'elementFactory',
	'spaceTool',
	'lassoTool',
	'handTool',
	'globalConnect',
	'translate',
	'config'
];


PaletteProvider.prototype.getPaletteEntries = function (element) {

	var actions = {},
		create = this._create,
		elementFactory = this._elementFactory,
		spaceTool = this._spaceTool,
		lassoTool = this._lassoTool,
		handTool = this._handTool,
		globalConnect = this._globalConnect,
		translate = this._translate,
		config = this._config;

	let isRelatedMode = config.isRelatedMode;

	function createAction(type, group, className, title, options) {

		function createListener(event) {
			var shape = elementFactory.createShape(assign({ type: type }, options));

			if (options) {
				shape.businessObject.di.isExpanded = options.isExpanded;
			}

			create.start(event, shape);
		}

		var shortType = type.replace(/^flow:/, '');

		return {
			group: group,
			className: className,
			title: title || translate('Create {type}', { type: shortType }),
			action: {
				dragstart: createListener,
				click: createListener
			}
		};
	}

	var source = {
		'hand-tool': {
			group: 'tools',
			className: 'flow-icon-hand-tool',
			title: translate('Activate the hand tool'),
			action: {
				click: function (event) {
					handTool.activateHand(event);
				}
			}
		},
		'lasso-tool': {
			group: 'tools',
			className: 'flow-icon-lasso-tool',
			title: translate('Activate the lasso tool'),
			action: {
				click: function (event) {
					lassoTool.activateSelection(event);
				}
			}
		},
		'space-tool': {
			group: 'tools',
			className: 'flow-icon-space-tool',
			title: translate('Activate the create/remove space tool'),
			action: {
				click: function (event) {
					spaceTool.activateSelection(event);
				}
			}
		},
		'global-connect-tool': {
			group: 'tools',
			className: 'flow-icon-connection-multi',
			title: translate('Activate the global connect tool'),
			action: {
				click: function (event) {
					globalConnect.toggle(event);
				}
			}
		},
		'tool-separator': {
			group: 'tools',
			separator: true
		},
		'create.start-event': createAction(
			'flow:State', 'event', 'flow-icon-start-event-none'
		),
	};
	if (isRelatedMode) {
		source['create.task'] = createAction(
			'flow:Related', 'event', 'relation-icon-start-event-none', translate('Create Related document')
		)
	}

	assign(actions, source);

	return actions;
};
