import OrderingProvider from 'diagram-js/lib/features/ordering/OrderingProvider';
import inherits from 'inherits';
import { find, findIndex } from 'min-dash';
import { isAny } from '../modeling/util/ModelingUtil';

/**
 * a simple ordering provider that makes sure:
 *
 * (1) elements are ordered by a {level} property
 * (2) elements with {alwaysOnTop} are always added to the root
 */
export default function FlowOrderingProvider(eventBus, translate) {

	OrderingProvider.call(this, eventBus);

	var orders = [];

	function computeOrder(element) {
		if (element.labelTarget) {
			return { level: 10 };
		}

		var entry = find(orders, function (o) {
			return isAny(element, [o.type]);
		});

		return entry && entry.order || { level: 1 };
	}

	function getOrder(element) {

		var order = element.order;

		if (!order) {
			element.order = order = computeOrder(element);
		}

		return order;
	}

	function findActualParent(element, newParent, containers) {

		var actualParent = newParent;

		while (actualParent) {

			if (isAny(actualParent, containers)) {
				break;
			}

			actualParent = actualParent.parent;
		}

		if (!actualParent) {
			throw new Error(translate('no parent for {element} in {parent}', {
				element: element.id,
				parent: newParent.id
			}));
		}

		return actualParent;
	}

	this.getOrdering = function (element, newParent) {

		var elementOrder = getOrder(element);


		if (elementOrder.containers) {
			newParent = findActualParent(element, newParent, elementOrder.containers);
		}


		var currentIndex = newParent.children.indexOf(element);

		var insertIndex = findIndex(newParent.children, function (child) {

			// do not compare with labels, they are created
			// in the wrong order (right after elements) during import and
			// mess up the positioning.
			if (!element.labelTarget && child.labelTarget) {
				return false;
			}

			return elementOrder.level < getOrder(child).level;
		});


		// if the element is already in the child list at
		// a smaller index, we need to adjust the inser index.
		// this takes into account that the element is being removed
		// before being re-inserted
		if (insertIndex !== -1) {
			if (currentIndex !== -1 && currentIndex < insertIndex) {
				insertIndex -= 1;
			}
		}

		return {
			index: insertIndex,
			parent: newParent
		};
	};
}

FlowOrderingProvider.$inject = ['eventBus', 'translate'];

inherits(FlowOrderingProvider, OrderingProvider);
