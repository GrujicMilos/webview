import { add as collectionAdd, remove as collectionRemove } from 'diagram-js/lib/util/Collections';

export default function UpdateCanvasRootHandler(canvas, modeling) {
	this._canvas = canvas;
	this._modeling = modeling;
}

UpdateCanvasRootHandler.$inject = [
	'canvas',
	'modeling'
];

UpdateCanvasRootHandler.prototype.execute = function (context) {

	var canvas = this._canvas;

	var newRoot = context.newRoot,
		newRootBusinessObject = newRoot.businessObject,
		oldRoot = canvas.getRootElement(),
		oldRootBusinessObject = oldRoot.businessObject,
		flowDefinitions = oldRootBusinessObject.$parent,
		diPlane = oldRootBusinessObject.di;

	// (1) replace process old <> new root
	canvas.setRootElement(newRoot, true);

	// (2) update root elements
	collectionAdd(flowDefinitions.rootElements, newRootBusinessObject);
	newRootBusinessObject.$parent = flowDefinitions;

	collectionRemove(flowDefinitions.rootElements, oldRootBusinessObject);
	oldRootBusinessObject.$parent = null;

	// (3) wire di
	oldRootBusinessObject.di = null;

	diPlane.flowElement = newRootBusinessObject;
	newRootBusinessObject.di = diPlane;

	context.oldRoot = oldRoot;

	// TODO(nikku): return changed elements?
	// return [ newRoot, oldRoot ];
};


UpdateCanvasRootHandler.prototype.revert = function (context) {

	var canvas = this._canvas;

	var newRoot = context.newRoot,
		newRootBusinessObject = newRoot.businessObject,
		oldRoot = context.oldRoot,
		oldRootBusinessObject = oldRoot.businessObject,
		flowDefinitions = newRootBusinessObject.$parent,
		diPlane = newRootBusinessObject.di;

	// (1) replace process old <> new root
	canvas.setRootElement(oldRoot, true);

	// (2) update root elements
	collectionRemove(flowDefinitions.rootElements, newRootBusinessObject);
	newRootBusinessObject.$parent = null;

	collectionAdd(flowDefinitions.rootElements, oldRootBusinessObject);
	oldRootBusinessObject.$parent = flowDefinitions;

	// (3) wire di
	newRootBusinessObject.di = null;

	diPlane.flowElement = oldRootBusinessObject;
	oldRootBusinessObject.di = diPlane;

	// TODO(nikku): return changed elements?
	// return [ newRoot, oldRoot ];
};
