import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';
import { add as collectionAdd, remove as collectionRemove } from 'diagram-js/lib/util/Collections';
import inherits from 'inherits';
import { find } from 'min-dash';
import { is } from '../../../util/ModelUtil';

var TARGET_REF_PLACEHOLDER_NAME = '__target_placeholder';


/**
 * This behavior makes sure we always set a fake
 * DataInputAssociation#target as demanded by the Flow
 * XSD schema.
 *
 * The reference is set to a flow:Property{ name: '__target_placeholder' }
 * which is created on the fly and cleaned up afterwards if not needed
 * anymore.
 *
 * @param {EventBus} eventBus
 * @param {FlowFactory} flowFactory
 */
export default function DataInputAssociationBehavior(eventBus, flowFactory) {

	CommandInterceptor.call(this, eventBus);


	this.executed([
		'connection.create',
		'connection.delete',
		'connection.move',
		'connection.reconnectEnd'
	], ifDataInputAssociation(fixtarget));

	this.reverted([
		'connection.create',
		'connection.delete',
		'connection.move',
		'connection.reconnectEnd'
	], ifDataInputAssociation(fixtarget));


	function usestarget(element, target, removedConnection) {

		var inputAssociations = element.get('dataInputAssociations');

		return find(inputAssociations, function (association) {
			return association !== removedConnection &&
				association.target === target;
		});
	}

	function gettarget(element, create) {

		var properties = element.get('properties');

		var targetProp = find(properties, function (p) {
			return p.name === TARGET_REF_PLACEHOLDER_NAME;
		});

		if (!targetProp && create) {
			targetProp = flowFactory.create('flow:Property', {
				name: TARGET_REF_PLACEHOLDER_NAME
			});

			collectionAdd(properties, targetProp);
		}

		return targetProp;
	}

	function cleanuptarget(element, connection) {

		var targetProp = gettarget(element);

		if (!targetProp) {
			return;
		}

		if (!usestarget(element, targetProp, connection)) {
			collectionRemove(element.get('properties'), targetProp);
		}
	}

	/**
	 * Make sure target is set to a valid property or
	 * `null` if the connection is detached.
	 *
	 * @param {Event} event
	 */
	function fixtarget(event) {

		var context = event.context,
			connection = context.connection,
			connectionBo = connection.businessObject,
			target = connection.target,
			targetBo = target && target.businessObject,
			newTarget = context.newTarget,
			newTargetBo = newTarget && newTarget.businessObject,
			oldTarget = context.oldTarget || context.target,
			oldTargetBo = oldTarget && oldTarget.businessObject;

		var dataAssociation = connection.businessObject,
			targetProp;

		if (oldTargetBo && oldTargetBo !== targetBo) {
			cleanuptarget(oldTargetBo, connectionBo);
		}

		if (newTargetBo && newTargetBo !== targetBo) {
			cleanuptarget(newTargetBo, connectionBo);
		}

		if (targetBo) {
			targetProp = gettarget(targetBo, true);
			dataAssociation.target = targetProp;
		} else {
			dataAssociation.target = null;
		}
	}
}

DataInputAssociationBehavior.$inject = [
	'eventBus',
	'flowFactory'
];

inherits(DataInputAssociationBehavior, CommandInterceptor);


/**
 * Only call the given function when the event
 * touches a flow:DataInputAssociation.
 *
 * @param {Function} fn
 * @return {Function}
 */
function ifDataInputAssociation(fn) {

	return function (event) {
		var context = event.context,
			connection = context.connection;

		if (is(connection, 'flow:DataInputAssociation')) {
			return fn(event);
		}
	};
}
