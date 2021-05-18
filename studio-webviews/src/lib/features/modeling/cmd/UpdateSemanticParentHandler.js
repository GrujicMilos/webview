export default function UpdateSemanticParentHandler(flowUpdater) {
	this._flowUpdater = flowUpdater;
}

UpdateSemanticParentHandler.$inject = ['flowUpdater'];


UpdateSemanticParentHandler.prototype.execute = function (context) {
	var dataStoreBo = context.dataStoreBo,
		newSemanticParent = context.newSemanticParent,
		newDiParent = context.newDiParent;

	context.oldSemanticParent = dataStoreBo.$parent;
	context.oldDiParent = dataStoreBo.di.$parent;

	// update semantic parent
	this._flowUpdater.updateSemanticParent(dataStoreBo, newSemanticParent);

	// update DI parent
	this._flowUpdater.updateDiParent(dataStoreBo.di, newDiParent);
};

UpdateSemanticParentHandler.prototype.revert = function (context) {
	var dataStoreBo = context.dataStoreBo,
		oldSemanticParent = context.oldSemanticParent,
		oldDiParent = context.oldDiParent;

	// update semantic parent
	this._flowUpdater.updateSemanticParent(dataStoreBo, oldSemanticParent);

	// update DI parent
	this._flowUpdater.updateDiParent(dataStoreBo.di, oldDiParent);
};

