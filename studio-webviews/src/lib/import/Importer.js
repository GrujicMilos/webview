import FlowTreeWalker from './FlowTreeWalker';

/**
 * Import the definitions into a diagram.
 *
 * Errors and warnings are reported through the specified callback.
 *
 * @param  {Diagram} diagram
 * @param  {ModdleElement} definitions
 * @param  {Function} done the callback, invoked with (err, [ warning ]) once the import is done
 */
export function importFlowDiagram(diagram, definitions, done) {

	var importer,
		eventBus,
		translate;

	var error,
		warnings = [];

	/**
	 * Walk the diagram semantically, importing (=drawing)
	 * all elements you encounter.
	 *
	 * @param {ModdleElement} definitions
	 */
	function render(definitions) {

		var visitor = {

			root: function (element) {
				return importer.add(element);
			},

			element: function (element, parentShape) {
				return importer.add(element, parentShape);
			},

			error: function (message, context) {
				warnings.push({message: message, context: context});
			}
		};

		var walker = new FlowTreeWalker(visitor, translate);
		walker.handleDefinitions(definitions);
	}

	try {
		importer = diagram.get('flowImporter');
		eventBus = diagram.get('eventBus');
		translate = diagram.get('translate');

		eventBus.fire('import.render.start', {definitions: definitions});
		render(definitions);

		eventBus.fire('import.render.complete', {
			error: error,
			warnings: warnings
		});
	} catch (e) {
		error = e;
	}

	done(error, warnings);
}
