'use strict';

import JSONEditor from 'jsoneditor';
import { classes as domClasses, domify as domify, query as domQuery } from 'min-dom';
import { getBusinessObject } from '../../util/ModelUtil';

/**
 * A properties panel implementation.
 *
 * To use it provide a `propertiesProvider` component that knows
 * about which properties to display.
 *
 * Properties edit state / visibility can be intercepted
 * via a custom {@link PropertiesActivator}.
 *
 * @class
 * @constructor
 *
 * @param {Object} config
 * @param {EventBus} eventBus
 * @param {Modeling} modeling
 * @param {PropertiesProvider} propertiesProvider
 * @param {Canvas} canvas
 * @param {CommandStack} commandStack
 */
export default function PropertiesPanel(config, eventBus, modeling, commandStack, canvas) {

	this._eventBus = eventBus;
	this._modeling = modeling;
	this._commandStack = commandStack;
	this._canvas = canvas;

	this._init(config);
}

PropertiesPanel.$inject = [
	'config.propertiesPanel',
	'eventBus',
	'modeling',
	'commandStack',
	'canvas'
];


PropertiesPanel.prototype._init = function (config) {

	var canvas = this._canvas,
		eventBus = this._eventBus;

	var self = this;

	/**
	 * Select the root element once it is added to the canvas
	 */
	eventBus.on('root.added', function (e) {
		var element = e.element;

		if (isImplicitRoot(element)) {
			return;
		}

		self.update(element);
	});

	eventBus.on('selection.changed', function (e) {
		var newElement = e.newSelection[0];

		var rootElement = canvas.getRootElement();

		console.log('selection changed', newElement);

		if (isImplicitRoot(rootElement)) {
			return;
		}

		self.update(newElement);
	});

	eventBus.on('elements.changed', function (e) {

		var current = self._current;
		var element = current && current.element;

		if (element) {
			if (e.elements.indexOf(element) !== -1) {
				self.update(element);
			}
		}
	});

	eventBus.on('elementTemplates.changed', function () {
		var current = self._current;
		var element = current && current.element;

		if (element) {
			self.update(element);
		}
	});

	eventBus.on('diagram.destroy', function () {
		self.detach();
	});

	this._container = domify('<div class="properties-panel"></div>');
	let editorOptions = {
		search: false,
		navigationBar: false,
		onEditable: (node) => {
			var editable = {
				field: true,
				value: true
			};
			if (node.path && node.path.length > 1) {
				editable.field = true;
			}
			return editable
		},
		onChangeJSON: this.onJsonUpdate.bind(this)
	};
	this._jsonEditor = new JSONEditor(this._container, editorOptions);

	//this._bindListeners(this._container);

	if (config && config.parent) {
		this.attachTo(config.parent);
	}
};

PropertiesPanel.prototype.onJsonUpdate = function (json) {
	let element = this._currentElement;
	let businessObject = getBusinessObject(element);

	for (var prop in json) {
		businessObject.set(prop, json[prop]);
	}
	this.applyChanges(element, json);
}


PropertiesPanel.prototype.attachTo = function (parentNode) {

	if (!parentNode) {
		throw new Error('parentNode required');
	}

	// ensure we detach from the
	// previous, old parent
	this.detach();

	// unwrap jQuery if provided
	if (parentNode.get && parentNode.constructor.prototype.jquery) {
		parentNode = parentNode.get(0);
	}

	if (typeof parentNode === 'string') {
		parentNode = domQuery(parentNode);
	}

	var container = this._container;

	parentNode.appendChild(container);

	this._emit('attach');
};

PropertiesPanel.prototype.detach = function () {

	var container = this._container,
		parentNode = container.parentNode;

	if (!parentNode) {
		return;
	}

	this._emit('detach');

	parentNode.removeChild(container);
};


/**
 * Update the DOM representation of the properties panel
 */
PropertiesPanel.prototype.update = function (element) {

	console.log('update called', element);

	if (!element) {
		domClasses(this._container).add('hide');
	} else {
		domClasses(this._container).remove('hide');

		let businessObject = getBusinessObject(element);

		let allProperties = businessObject.$descriptor.properties;
		let attributes = allProperties.filter((prop) => prop.isAttr && !prop.isId);
		let props = {};
		attributes.forEach((attr) => {
			props[attr.name] = businessObject[attr.name];
		})
		this._jsonEditor.set(props);
		this._currentElement = element;
	}


	this._emit('changed');
};


PropertiesPanel.prototype._emit = function (event) {
	this._eventBus.fire('propertiesPanel.' + event, { panel: this, current: this._current });
};

/**
 * Apply changes to the business object by executing a command
 */
PropertiesPanel.prototype.applyChanges = function (element, values) {
	this._commandStack.execute('element.updateProperties', {
		element,
		properties: values
	});
};

function isImplicitRoot(element) {
	return element.id === '__implicitroot';
}
