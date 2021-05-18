import { assign, map, pick } from 'min-dash';
import { isAny } from './util/ModelingUtil';

export default function FlowFactory(moddle) {
	this._model = moddle;
}

FlowFactory.$inject = ['moddle'];

FlowFactory.prototype._needsId = function (element) {
	return isAny(element, [
		'flow:RootElement',
		'flow:Relationship',
		'flowdi:FLOWShape',
		'flowdi:FLOWEdge',
		'flowdi:FLOWDiagram',
		'flowdi:FLOWPlane',
	]);
};

FlowFactory.prototype._ensureId = function (element) {

	// generate semantic ids for elements
	// flow:SequenceFlow -> SequenceFlow_ID
	var prefix = (element.$type || '').replace(/^[^:]*:/g, '') + '_';

	if (!element.id && this._needsId(element)) {
		element.id = this._model.ids.nextPrefixed(prefix, element);
	}
};

FlowFactory.prototype.create = function (type, attrs) {
	var element = this._model.create(type, attrs || {});

	this._ensureId(element);

	return element;
};

FlowFactory.prototype.createDiLabel = function () {
	return this.create('flowdi:FLOWLabel', {
		bounds: this.createDiBounds()
	});
};

FlowFactory.prototype.createDiShape = function (semantic, bounds, attrs) {

	return this.create('flowdi:FLOWShape', assign({
		flowElement: semantic,
		bounds: this.createDiBounds(bounds)
	}, attrs));
};

FlowFactory.prototype.createDiBounds = function (bounds) {
	return this.create('dc:Bounds', bounds);
};

FlowFactory.prototype.createDiWaypoints = function (waypoints) {
	var self = this;

	return map(waypoints, function (pos) {
		return self.createDiWaypoint(pos);
	});
};

FlowFactory.prototype.createDiWaypoint = function (point) {
	return this.create('dc:Point', pick(point, ['x', 'y']));
};

FlowFactory.prototype.createDiEdge = function (semantic, waypoints, attrs) {
	return this.create('flowdi:FLOWEdge', assign({
		flowElement: semantic
	}, attrs));
};

FlowFactory.prototype.createDiPlane = function (semantic) {
	return this.create('flowdi:FLOWPlane', {
		flowElement: semantic
	});
};
