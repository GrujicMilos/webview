import EditorActions from 'diagram-js/lib/features/editor-actions/EditorActions';
import { getBBox } from 'diagram-js/lib/util/Elements';
import inherits from 'inherits';
import { filter } from 'min-dash';
import { is } from '../../util/ModelUtil';

/**
 * Registers and executes FLOW specific editor actions.
 */
export default function FlowEditorActions(
	injector, canvas, elementRegistry,
	selection, spaceTool, lassoTool,
	handTool, globalConnect,
	alignElements, directEditing,
	modeling) {

	injector.invoke(EditorActions, this);

	this.register({
		selectElements: function () {
			// select all elements except for the invisible
			// root element
			var rootElement = canvas.getRootElement();

			var elements = elementRegistry.filter(function (element) {
				return element !== rootElement;
			});

			selection.select(elements);

			return elements;
		},
		spaceTool: function () {
			spaceTool.toggle();
		},
		lassoTool: function () {
			lassoTool.toggle();
		},
		handTool: function () {
			handTool.toggle();
		},
		globalConnectTool: function () {
			globalConnect.toggle();
		},
		alignElements: function (opts) {
			var currentSelection = selection.get(),
				aligneableElements = [],
				type = opts.type;

			if (currentSelection.length) {
				aligneableElements = filter(currentSelection, function (element) {
					return !is(element, 'flow:Lane');
				});

				alignElements.trigger(aligneableElements, type);
			}
		},
		setColor: function (opts) {
			var currentSelection = selection.get();

			if (currentSelection.length) {
				modeling.setColor(currentSelection, opts);
			}
		},
		directEditing: function () {
			var currentSelection = selection.get();

			if (currentSelection.length) {
				directEditing.activate(currentSelection[0]);
			}
		},
		moveToOrigin: function () {
			var rootElement = canvas.getRootElement(),
				boundingBox,
				elements;

			elements = elementRegistry.filter(function (element) {
				return element !== rootElement;
			});

			boundingBox = getBBox(elements);

			modeling.moveElements(elements, { x: -boundingBox.x, y: -boundingBox.y }, rootElement);
		}
	});
}

inherits(FlowEditorActions, EditorActions);

FlowEditorActions.$inject = [
	'injector',
	'canvas',
	'elementRegistry',
	'selection',
	'spaceTool',
	'lassoTool',
	'handTool',
	'globalConnect',
	'alignElements',
	'directEditing',
	'modeling'
];
