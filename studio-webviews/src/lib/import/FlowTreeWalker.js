import { find, forEach } from 'min-dash';
import Refs from 'object-refs';
import { elementToString } from './Util';
var diRefs = new Refs(
	{name: 'flowElement', enumerable: true},
	{name: 'di', configurable: true}
);

/**
 * Returns true if an element has the given meta-model type
 *
 * @param  {ModdleElement}  element
 * @param  {String}         type
 *
 * @return {Boolean}
 */
function is(element, type) {
	return element.$instanceOf(type);
}


/**
 * Find a suitable display candidate for definitions where the DI does not
 * correctly specify one.
 */
function findDisplayCandidate(definitions) {
	return find(definitions.rootElements, function (e) {
		return is(e, 'flow:State');
	});
}


export default function FlowTreeWalker(handler, translate) {

	// list of containers already walked
	var handledElements = {};

	// list of elements to handle deferred to ensure
	// prerequisites are drawn
	var deferred = [];

	// Helpers //////////////////////

	function handled(element) {
		handledElements[element.id] = element;
	}

	function visit(element, ctx) {

		var gfx = element.gfx;

		// avoid multiple rendering of elements
		if (gfx) {
			throw new Error(
				translate('already rendered {element}', {element: elementToString(element)})
			);
		}

		// call handler
		return handler.element(element, ctx);
	}

	function visitRoot(element, diagram) {
		return handler.root(element, diagram);
	}

	function visitIfDi(element, ctx) {
		try {
			var gfx = element.di && visit(element, ctx);

			handled(element);
			return gfx;
		} catch (e) {
			logError(e.message, {element: element, error: e});

			console.error(translate('failed to import {element}', {element: elementToString(element)}));
			console.error(e);
		}
	}

	function logError(message, context) {
		handler.error(message, context);
	}

	// DI handling //////////////////////

	function registerDi(di) {
		var flowElement = di.flowElement;

		if (flowElement) {
			if (flowElement.di) {
				logError(
					translate('multiple DI elements defined for {element}', {
						element: elementToString(flowElement)
					}),
					{element: flowElement}
				);
			} else {
				diRefs.bind(flowElement, 'di');
				flowElement.di = di;
			}
		} else {
			logError(
				translate('no flowElement referenced in {element}', {
					element: elementToString(di)
				}),
				{element: di}
			);
		}
	}

	function handleDiagram(diagram) {
		handleDiPlane(diagram.plane);
	}

	function handleDiPlane(plane) {
		registerDi(plane);

		forEach(plane.planeElement, handleDiPlaneElement);
	}

	function handleDiPlaneElement(planeElement) {
		registerDi(planeElement);
	}


	// Semantic handling //////////////////////

	/**
	 * Handle definitions and return the rendered diagram (if any)
	 *
	 * @param {ModdleElement} definitions to walk and import
	 * @param {ModdleElement} [diagram] specific diagram to import and display
	 *
	 * @throws {Error} if no diagram to display could be found
	 */
	function handleDefinitions(definitions, diagram) {
		// make sure we walk the correct flowElement

		var diagrams = definitions.diagrams;

		if (diagram && diagrams.indexOf(diagram) === -1) {
			throw new Error(translate('diagram not part of flow:Definitions'));
		}

		if (!diagram && diagrams && diagrams.length) {
			diagram = diagrams[0];
		}

		// no diagram -> nothing to import
		if (!diagram) {
			throw new Error(translate('no diagram to display'));
		}

		// load DI from selected diagram only
		handleDiagram(diagram);


		var plane = diagram.plane;

		if (!plane) {
			throw new Error(translate(
				'no plane for {element}',
				{element: elementToString(diagram)}
			));
		}
		var rootElement = plane.flowElement;

		// ensure we default to a suitable display candidate (process or collaboration),
		// even if non is specified in DI
		if (!rootElement) {
			rootElement = findDisplayCandidate(definitions);

			if (!rootElement) {
				throw new Error(translate('no process or collaboration to display'));
			} else {

				logError(
					translate('correcting missing flowElement on {plane} to {rootElement}', {
						plane: elementToString(plane),
						rootElement: elementToString(rootElement)
					})
				);

				// correct DI on the fly
				plane.flowElement = rootElement;
				registerDi(plane);
			}
		}


		var ctx = visitRoot(rootElement, plane);
		if (is(rootElement, 'flow:Plane')) {
			handlePlane(rootElement, ctx);
		} else {
			throw new Error(
				translate('unsupported flowElement for {plane}: {rootElement}', {
					plane: elementToString(plane),
					rootElement: elementToString(rootElement)
				})
			);
		}

		// handle all deferred elements
		handleDeferred(deferred);
	}

	function handleDeferred() {

		var fn;

		// drain deferred until empty
		while (deferred.length) {
			fn = deferred.shift();
			fn();
		}
	}

	function handlePlane(plane, context) {
		handlePlaneNodes(plane.nodes, context);

		// log process handled
		handled(plane);
	}

	function handleRelationship(state, context) {
		visitIfDi(state, context);
	}

	function handleState(state, context) {
		visitIfDi(state, context);
	}

	function handlePlaneNodes(node, context) {
		forEach(node, function (e) {
			if (is(e, 'flow:Relationship')) {
				deferred.push(function () {
					handleRelationship(e, context);
				});
			} else if (is(e, 'flow:State')) {
				handleState(e, context);
			} else if (is(e, 'flow:Related')) {
				handleState(e, context);
			} else {
				logError(
					translate('unrecognized flowElement {element} in context {context}', {
						element: elementToString(e),
						context: (context ? elementToString(context.businessObject) : 'null')
					}),
					{element: e, context: context}
				);
			}
		});
	}

	// API //////////////////////

	return {
		handleDeferred: handleDeferred,
		handleDefinitions: handleDefinitions,
		registerDi: registerDi
	};
}
