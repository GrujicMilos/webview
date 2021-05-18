/* eslint-disable */
import { hasPrimaryModifier } from 'diagram-js/lib/util/Mouse';
import { assign, isArray } from 'min-dash';
import { is, isAny } from '../../../../dmn-js-shared/src/util/ModelUtil';

/**
 * A provider for DMN elements context pad
 */
export default function ContextPadProvider(
    eventBus,
    contextPad,
    modeling,
    elementFactory,
    connect,
    create,
    rules,
    popupMenu,
    canvas,
    translate,
    config,
    injector
) {
    config = config || {};

    contextPad.registerProvider(this);

    this._contextPad = contextPad;

    this._modeling = modeling;

    this._elementFactory = elementFactory;
    this._connect = connect;
    this._create = create;
    this._rules = rules;
    this._popupMenu = popupMenu;
    this._canvas = canvas;
    this._translate = translate;
    this._eventBus = eventBus;

    if (config.autoPlace !== false) {
        this._autoPlace = injector.get('autoPlace', false);
    }

    eventBus.on('create.end', 250, function (event) {
        const shape = event.context.shape;

        if (!hasPrimaryModifier(event)) {
            return;
        }

        const entries = contextPad.getEntries(shape);

        if (entries.replace) {
            entries.replace.action.click(event, shape);
        }
    });
}

ContextPadProvider.$inject = [
    'eventBus',
    'contextPad',
    'modeling',
    'elementFactory',
    'connect',
    'create',
    'rules',
    'popupMenu',
    'canvas',
    'translate',
    'config.contextPad',
    'injector',
];

ContextPadProvider.prototype.getContextPadEntries = function (element) {
    const modeling = this._modeling,
        elementFactory = this._elementFactory,
        connect = this._connect,
        create = this._create,
        popupMenu = this._popupMenu,
        canvas = this._canvas,
        contextPad = this._contextPad,
        rules = this._rules,
        translate = this._translate,
        autoPlace = this._autoPlace;

    const actions = {};

    if (element.type === 'label') {
        return actions;
    }

    const businessObject = element.businessObject;

    function startConnect(event, element, autoActivate) {
        connect.start(event, element, autoActivate);
    }

    function removeElement(e) {
        modeling.removeElements([element]);
    }

    function getReplaceMenuPosition(element) {
        const Y_OFFSET = 5;

        const diagramContainer = canvas.getContainer(),
            pad = contextPad.getPad(element).html;

        const diagramRect = diagramContainer.getBoundingClientRect(),
            padRect = pad.getBoundingClientRect();

        const top = padRect.top - diagramRect.top;
        const left = padRect.left - diagramRect.left;

        return {
            x: left,
            y: top + padRect.height + Y_OFFSET,
        };
    }

    /**
     * Create an append action
     *
     * @param {string} type
     * @param {string} className
     * @param {string} [title]
     * @param {Object} [options]
     *
     * @return {Object} descriptor
     */
    function appendAction(type, className, title, options) {

        if (typeof title !== 'string') {
            options = title;
            title = translate('Append {type}', { type: type.replace(/^dmn:/, '') });
        }

        function appendStart(event, element) {
            const shape = elementFactory.createShape(assign({ type: type }, options));

            create.start(event, shape, {
                source: element,
                hints: {
                    connectionTarget: element,
                },
            });
        }

        const append = autoPlace
            ? function (event, element) {
                const shape = elementFactory.createShape(assign({ type: type }, options));

                autoPlace.append(element, shape, {
                    connectionTarget: element,
                });
            }
            : appendStart;

        return {
            group: 'model',
            className: className,
            title: title,
            action: {
                dragstart: appendStart,
                click: append,
            },
        };
    }

    if (is(businessObject, 'dmn:Decision')) {
        assign(actions, {
            'append.decision': appendAction('dmn:Decision', 'dmn-icon-decision', null),
        });
    }

    if (
        isAny(businessObject, ['dmn:BusinessKnowledgeModel', 'dmn:Decision', 'dmn:KnowledgeSource'])
    ) {
        assign(actions, {
            'append.knowledge-source': appendAction(
                'dmn:KnowledgeSource',
                'dmn-icon-knowledge-source'
            ),
        });
    }

    if (isAny(businessObject, ['dmn:BusinessKnowledgeModel', 'dmn:Decision'])) {
        assign(actions, {
            'append.business-knowledge-model': appendAction(
                'dmn:BusinessKnowledgeModel',
                'dmn-icon-business-knowledge'
            ),
        });
    }

    if (isAny(businessObject, ['dmn:Decision', 'dmn:KnowledgeSource'])) {
        assign(actions, {
            'append.input-data': appendAction('dmn:InputData', 'dmn-icon-input-data'),
        });
    }

    if (is(businessObject, 'dmn:DRGElement')) {
        assign(actions, {
            'append.text-annotation': appendAction(
                'dmn:TextAnnotation',
                'dmn-icon-text-annotation'
            ),

            connect: {
                group: 'connect',
                className: 'dmn-icon-connection-multi',
                title: translate(
                    'Connect using Information/Knowledge' + '/Authority Requirement or Association'
                ),
                action: {
                    click: startConnect,
                    dragstart: startConnect,
                },
            },
        });
    }

    if (!popupMenu.isEmpty(element, 'dmn-replace')) {
        // Replace menu entry
        let isChangeTypeAllowed = (element.businessObject && element.businessObject.di['canChangeType']) !== undefined ? element.businessObject.di['canChangeType'] : true;
        if (isChangeTypeAllowed) {
            assign(actions, {
                replace: {
                    group: 'edit',
                    className: 'dmn-icon-screw-wrench',
                    title: translate('Change type'),
                    action: {
                        click: function (event, element) {
                            const position = assign(getReplaceMenuPosition(element), {
                                cursor: { x: event.x, y: event.y },
                            });

                            popupMenu.open(element, 'dmn-replace', position);
                        },
                    },
                },
            });
        }
    }

    if (isAny(businessObject, ['dmn:BusinessKnowledgeModel'])) {
        assign(actions, {
            select: {
                group: 'edit',
                className: 'dmn-icon-edit',
                title: translate('Select'),
                action: {
                    click: (event, element) => {
                        this._eventBus.fire('adInsure.selectLibrary', {
                            event,
                            element,
                        });
                    },
                },
            }
        });
    }


    // delete element entry, only show if allowed by rules
    let deleteAllowed = rules.allowed('elements.delete', { elements: [element] });
    let isDeleteAllowed = (element.businessObject && element.businessObject.di['deletable']) !== undefined ? element.businessObject.di['deletable'] : true;

    if (isArray(deleteAllowed)) {
        // was the element returned as a deletion candidate?
        deleteAllowed = deleteAllowed[0] === element;
    }

    if (deleteAllowed && isDeleteAllowed) {
        assign(actions, {
            delete: {
                group: 'edit',
                className: 'dmn-icon-trash',
                title: translate('Remove'),
                action: {
                    click: removeElement,
                },
            },
        });
    }

    return actions;
};
