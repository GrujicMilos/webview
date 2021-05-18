import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';
import inherits from 'inherits';
import { isLabel } from '../../util/LabelUtil';
import { isAny } from '../modeling/util/ModelingUtil';

/**
 * Extention of GlobalConnect tool that implements FLOW specific rules about
 * connection start elements.
 */
export default function FlowGlobalConnect(eventBus) {
	RuleProvider.call(this, eventBus);
}

FlowGlobalConnect.prototype.init = function () {
	this.addRule('connection.start', function (context) {
		var source = context.source;

		return canStartConnection(source);
	});
}

inherits(FlowGlobalConnect, RuleProvider);

FlowGlobalConnect.$inject = ['globalConnect'];


/**
 * Checks if given element can be used for starting connection.
 *
 * @param  {Element} source
 * @return {Boolean}
 */
FlowGlobalConnect.prototype.canStartConnect = function (source) {

	if (nonExistantOrLabel(source)) {
		return null;
	}

	var businessObject = source.businessObject;

	return isAny(businessObject, [
		'flow:State'
	]);
};


function nonExistantOrLabel(element) {
	return !element || isLabel(element);
}


