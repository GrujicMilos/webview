import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';
import { Label } from 'diagram-js/lib/model';
import { remove as collectionRemove } from 'diagram-js/lib/util/Collections';
import inherits from 'inherits';
import { assign, forEach } from 'min-dash';
import { getBusinessObject, is } from '../../util/ModelUtil';

/**
 * A handler responsible for updating the underlying Flow XML + DI
 * once changes on the diagram happen
 */
export default function FlowUpdater(eventBus, flowFactory, connectionDocking, translate) {
    CommandInterceptor.call(this, eventBus);

    this._flowFactory = flowFactory;
    this._translate = translate;

    const self = this;

    // connection cropping //////////////////////

    // crop connection ends during create/update
    function cropConnection(e) {
        let context = e.context,
            connection;

        if (!context.cropped) {
            connection = context.connection;
            connection.waypoints = connectionDocking.getCroppedWaypoints(connection);
            context.cropped = true;
        }
    }

    this.executed(
        [
            'connection.layout',
            'connection.create',
            'connection.reconnectEnd',
            'connection.reconnectStart',
            'connection.reconnect',
        ],
        cropConnection
    );

    this.reverted(['connection.layout'], function (e) {
        delete e.context.cropped;
    });

    // FLOW + DI update //////////////////////

    // update parent
    function updateParent(e) {
        const context = e.context;

        self.updateParent(context.shape || context.connection, context.oldParent);
    }

    function reverseUpdateParent(e) {
        const context = e.context;

        const element = context.shape || context.connection,
            // oldParent is the (old) new parent, because we are undoing
            oldParent = context.parent || context.newParent;

        self.updateParent(element, oldParent);
    }

    this.executed(
        [
            'shape.move',
            'shape.create',
            'shape.delete',
            'connection.create',
            'connection.move',
            'connection.delete',
        ],
        ifFlow(updateParent)
    );

    this.reverted(
        [
            'shape.move',
            'shape.create',
            'shape.delete',
            'connection.create',
            'connection.move',
            'connection.delete',
        ],
        ifFlow(reverseUpdateParent)
    );

    /*
     * ## Updating Parent
     *
     * When morphing a Process into a Collaboration or vice-versa,
     * make sure that both the *semantic* and *di* parent of each element
     * is updated.
     *
     */
    function updateRoot(event) {
        const context = event.context,
            oldRoot = context.oldRoot,
            children = oldRoot.children;

        forEach(children, function (child) {
            if (is(child, 'flow:BaseElement')) {
                self.updateParent(child);
            }
        });
    }

    this.executed(['canvas.updateRoot'], updateRoot);
    this.reverted(['canvas.updateRoot'], updateRoot);

    // update bounds
    function updateBounds(e) {
        const shape = e.context.shape;

        if (!is(shape, 'flow:BaseElement')) {
            return;
        }

        self.updateBounds(shape);
    }

    this.executed(
        ['shape.move', 'shape.create', 'shape.resize'],
        ifFlow(function (event) {
            // exclude labels because they're handled separately during shape.changed
            if (event.context.shape.type === 'label') {
                return;
            }

            updateBounds(event);
        })
    );

    this.reverted(
        ['shape.move', 'shape.create', 'shape.resize'],
        ifFlow(function (event) {
            // exclude labels because they're handled separately during shape.changed
            if (event.context.shape.type === 'label') {
                return;
            }

            updateBounds(event);
        })
    );

    // Handle labels separately. This is necessary, because the label bounds have to be updated
    // every time its shape changes, not only on move, create and resize.
    eventBus.on('shape.changed', function (event) {
        if (event.element.type === 'label') {
            updateBounds({ context: { shape: event.element } });
        }
    });

    // attach / detach connection
    function updateConnection(e) {
        self.updateConnection(e.context);
    }

    this.executed(
        [
            'connection.create',
            'connection.move',
            'connection.delete',
            'connection.reconnectEnd',
            'connection.reconnectStart',
            'connection.reconnect',
        ],
        ifFlow(updateConnection)
    );

    this.reverted(
        [
            'connection.create',
            'connection.move',
            'connection.delete',
            'connection.reconnectEnd',
            'connection.reconnectStart',
            'connection.reconnect',
        ],
        ifFlow(updateConnection)
    );

    // update waypoints
    function updateConnectionWaypoints(e) {
        self.updateConnectionWaypoints(e.context.connection);
    }

    this.executed(
        [
            'connection.layout',
            'connection.move',
            'connection.updateWaypoints',
            'connection.reconnectEnd',
			'connection.reconnectStart',
			'connection.reconnect',
        ],
        ifFlow(updateConnectionWaypoints)
    );

    this.reverted(
        [
            'connection.layout',
            'connection.move',
            'connection.updateWaypoints',
            'connection.reconnectEnd',
			'connection.reconnectStart',
			'connection.reconnect',
        ],
        ifFlow(updateConnectionWaypoints)
    );

    // update Default & Conditional flows
    this.executed(
        ['connection.reconnectEnd', 'connection.reconnectStart', 'connection.reconnect'],
        ifFlow(function (e) {
            const context = e.context,
                connection = context.connection,
                businessObject = getBusinessObject(connection),
                oldSource = getBusinessObject(context.oldSource),
                oldTarget = getBusinessObject(context.oldTarget),
                newSource = getBusinessObject(connection.source),
                newTarget = getBusinessObject(connection.target);

            if (oldSource === newSource || oldTarget === newTarget) {
                return;
            }

            // on reconnectStart -> default flow
            if (oldSource && oldSource.default === businessObject) {
                context.default = oldSource.default;
                oldSource.default = undefined;
            }

            // on reconnectEnd -> default flow
            if (
                businessObject.source &&
                businessObject.source.default &&
                !is(newTarget, 'flow:State')
            ) {
                context.default = businessObject.source.default;
                businessObject.source.default = undefined;
            }
        })
    );

    // update attachments
    function updateAttachment(e) {
        self.updateAttachment(e.context);
    }

    this.executed(['element.updateAttachment'], ifFlow(updateAttachment));
    this.reverted(['element.updateAttachment'], ifFlow(updateAttachment));
}

inherits(FlowUpdater, CommandInterceptor);

FlowUpdater.$inject = ['eventBus', 'flowFactory', 'connectionDocking', 'translate'];

// implementation //////////////////////

FlowUpdater.prototype.updateAttachment = function (context) {
    const shape = context.shape,
        businessObject = shape.businessObject,
        host = shape.host;

    businessObject.attachedToRef = host && host.businessObject;
};

FlowUpdater.prototype.updateParent = function (element) {
    // do not update FLOW label parent
    if (element instanceof Label) {
        return;
    }

    const parentShape = element.parent;

    const businessObject = element.businessObject,
        parentBusinessObject = parentShape && parentShape.businessObject,
        parentDi = parentBusinessObject && parentBusinessObject.di;

    this.updateSemanticParent(businessObject, parentBusinessObject);

    this.updateDiParent(businessObject.di, parentDi);
};

FlowUpdater.prototype.updateBounds = function (shape) {
    const di = shape.businessObject.di;

    const target = shape instanceof Label ? this._getLabel(di) : di;

    let bounds = target.bounds;

    if (!bounds) {
        bounds = this._flowFactory.createDiBounds();
        target.set('bounds', bounds);
    }

    assign(bounds, {
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
    });
};

// update existing sourceElement and targetElement di information
FlowUpdater.prototype.updateDiConnection = function (di, newSource, newTarget) {
    if (di.sourceElement && di.sourceElement.flowElement !== newSource) {
        di.sourceElement = newSource && newSource.di;
    }

    if (di.targetElement && di.targetElement.flowElement !== newTarget) {
        di.targetElement = newTarget && newTarget.di;
    }
};

FlowUpdater.prototype.updateDiParent = function (di, parentDi) {
    if (!parentDi) {
        console.warn('DI parent not existing');
        return;
    }

    if (parentDi && !is(parentDi, 'flowdi:FLOWPlane')) {
        parentDi = parentDi.$parent;
    }

    if (di.$parent === parentDi) {
        return;
    }

    const planeElements = (parentDi || di.$parent).get('planeElement');

    if (parentDi) {
        planeElements.push(di);
        di.$parent = parentDi;
    } else {
        collectionRemove(planeElements, di);
        di.$parent = null;
    }
};

FlowUpdater.prototype.getLaneSet = function (container) {
    let laneSet, laneSets;

    laneSets = container.get('laneSets');
    laneSet = laneSets[0];

    if (!laneSet) {
        laneSet = this._flowFactory.create('flow:LaneSet');
        laneSet.$parent = container;
        laneSets.push(laneSet);
    }

    return laneSet;
};

FlowUpdater.prototype.updateSemanticParent = function (businessObject, newParent, visualParent) {
    let containment,
        translate = this._translate;

    if (businessObject.$parent === newParent) {
        return;
    }

    if (is(businessObject, 'flow:Relationship')) {
        containment = 'nodes';
    } else if (is(businessObject, 'flow:State')) {
        containment = 'nodes';
    } else if (is(businessObject, 'flow:Related')) {
        containment = 'nodes';
    }

    if (!containment) {
        throw new Error(
            translate('no parent for {element} in {parent}', {
                element: businessObject.id,
                parent: newParent.id,
            })
        );
    }

    let children;

    if (businessObject.$parent) {
        // remove from old parent
        children = businessObject.$parent.get(containment);
        collectionRemove(children, businessObject);
    }

    if (!newParent) {
        businessObject.$parent = null;
    } else {
        // add to new parent
        children = newParent.get(containment);
        children.push(businessObject);
        businessObject.$parent = newParent;
    }

    if (visualParent) {
        let diChildren = visualParent.get(containment);

        collectionRemove(children, businessObject);

        if (newParent) {
            if (!diChildren) {
                diChildren = [];
                newParent.set(containment, diChildren);
            }

            diChildren.push(businessObject);
        }
    }
};

FlowUpdater.prototype.updateConnectionWaypoints = function (connection) {
    connection.businessObject.di.set(
        'waypoint',
        this._flowFactory.createDiWaypoints(connection.waypoints)
    );
};

FlowUpdater.prototype.updateConnection = function (context) {
    const connection = context.connection,
        businessObject = getBusinessObject(connection),
        newSource = getBusinessObject(connection.source),
        newTarget = getBusinessObject(connection.target);

    const inverseSet = is(businessObject, 'flow:SequenceFlow');

    if (businessObject.source !== newSource) {
        if (inverseSet) {
            collectionRemove(
                businessObject.source && businessObject.source.get('outgoing'),
                businessObject
            );

            if (newSource && newSource.get('outgoing')) {
                newSource.get('outgoing').push(businessObject);
            }
        }

        businessObject.source = newSource;
    }

    if (businessObject.target !== newTarget) {
        if (inverseSet) {
            collectionRemove(
                businessObject.target && businessObject.target.get('incoming'),
                businessObject
            );

            if (newTarget && newTarget.get('incoming')) {
                newTarget.get('incoming').push(businessObject);
            }
        }

        businessObject.target = newTarget;
    }

    this.updateConnectionWaypoints(connection);

    this.updateDiConnection(businessObject.di, newSource, newTarget);
};

// helpers //////////////////////

FlowUpdater.prototype._getLabel = function (di) {
    if (!di.label) {
        di.label = this._flowFactory.createDiLabel();
    }

    return di.label;
};

/**
 * Make sure the event listener is only called
 * if the touched element is a Flow element.
 *
 * @param  {Function} fn
 * @return {Function} guarded function
 */
function ifFlow(fn) {
    return function (event) {
        const context = event.context,
            element = context.shape || context.connection;

        if (is(element, 'flow:BaseElement')) {
            fn(event);
        }
    };
}
