import { hasPrimaryModifier } from 'diagram-js/lib/util/Mouse';
import { assign, isArray } from 'min-dash';
import { isAny } from '../modeling/util/ModelingUtil';

/**
 * A provider for flow elements context pad
 */
export default function ContextPadProvider(
	config, injector, eventBus,
	contextPad, modeling, elementFactory,
	connect, create,
	canvas, rules, translate, configAll) {

	config = config || {};

	contextPad.registerProvider(this);

	this._contextPad = contextPad;

	this._modeling = modeling;

	this._elementFactory = elementFactory;
	this._connect = connect;
	this._create = create;
	this._canvas = canvas;
	this._rules = rules;
	this._translate = translate;
	this._configAll = configAll;
    this._adInsureOptions = undefined;

	if (config.autoPlace !== false) {
		this._autoPlace = injector.get('autoPlace', false);
	}

	eventBus.on('create.end', 250, function (event) {
		var shape = event.context.shape;

		if (!hasPrimaryModifier(event)) {
			return;
		}

		var entries = contextPad.getEntries(shape);

		if (entries.replace) {
			entries.replace.action.click(event, shape);
		}
	});
}

ContextPadProvider.$inject = [
	'config.contextPad',
	'injector',
	'eventBus',
	'contextPad',
	'modeling',
	'elementFactory',
	'connect',
	'create',
	'canvas',
	'rules',
	'translate',
	'config'
];


ContextPadProvider.prototype.getContextPadEntries = function (element) {

	var modeling = this._modeling,

		elementFactory = this._elementFactory,
		connect = this._connect,
		create = this._create,
		rules = this._rules,
		autoPlace = this._autoPlace,
		translate = this._translate,
        adInsureOptions = this._adInsureOptions,
		configAll = this._configAll;

	var actions = {};

	if (element.type === 'label') {
		return actions;
	}

	let isRelatedMode = configAll.isRelatedMode;
	var businessObject = element.businessObject;

	function startConnect(event, element) {
		connect.start(event, element);
	}

	async function removeElement() {
        let shouldRemove = false;
        if (adInsureOptions && adInsureOptions.confirmationService) {
            shouldRemove = await adInsureOptions.confirmationService.open(
                'Are you sure you want to remove this element and the elements connected to it?'
            );
        }
        if (shouldRemove) {
		    modeling.removeElements([element]);
        }
	}

	/**
	 * Create an append action
	 *
	 * @param {String} type
	 * @param {String} className
	 * @param {String} [title]
	 * @param {Object} [options]
	 *
	 * @return {Object} descriptor
	 */
	function appendAction(type, className, title, options) {

		if (typeof title !== 'string') {
			options = title;
			title = translate('Append {type}', { type: type.replace(/^flow:/, '') });
		}

		function appendStart(event, element) {

			var shape = elementFactory.createShape(assign({ type: type }, options));
			create.start(event, shape, element);
		}


		var append = autoPlace ? function (event, element) {
			var shape = elementFactory.createShape(assign({ type: type }, options));

			autoPlace.append(element, shape);
		} : appendStart;


		return {
			group: 'model',
			className: className,
			title: title,
			action: {
				dragstart: appendStart,
				click: append
			}
		};
	}
	var source = {
		'append.state': appendAction(
			'flow:State',
			'flow-icon-start-event-none',
			translate('Append state')
		),
		'connect': {
			group: 'connect',
			className: 'flow-icon-connection-multi',
			title: translate('Connect using ' +
				(businessObject.isForCompensation ? '' : 'Sequence/MessageFlow or ') +
				'Association'),
			action: {
				click: startConnect,
				dragstart: startConnect
			}
		}
	};

	if (isRelatedMode) {
		source['append.task'] = appendAction(
			'flow:Related', 'relation-icon-start-event-none', translate('Append related document')
		)
	}

	if (isAny(businessObject, [
		'flow:State'
	])) {

		assign(actions, source);
	}


	// delete element entry, only show if allowed by rules
	var deleteAllowed = rules.allowed('elements.delete', { elements: [element] });

	if (isArray(deleteAllowed)) {
		// was the element returned as a deletion candidate?
		deleteAllowed = deleteAllowed[0] === element;
	}

	if (deleteAllowed) {
		assign(actions, {
			'delete': {
				group: 'edit',
				className: 'flow-icon-trash',
				title: translate('Remove'),
				action: {
					click: removeElement
				}
			}
		});
	}

	return actions;
};
