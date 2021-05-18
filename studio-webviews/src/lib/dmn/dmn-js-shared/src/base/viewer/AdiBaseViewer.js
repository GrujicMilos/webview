/* eslint-disable */
import { assign } from 'min-dash';
import { domify, remove as domRemove } from 'min-dom';
import BaseViewer from './Viewer';


/**
 * Base class for AdInsure decision viewers
 */
export default class AdiBaseViewer extends BaseViewer {

    constructor(options = {}) {
        const container = AdiBaseViewer._createContainer();

        super(assign(options, {
            renderer: {
                container
            }
        }));

        this._container = container;
        this._decisionEditor = undefined;

        this.onSave = () => {
            this._decisionEditor.prepareDecision();
        };

        this.viewDrd = () => {
            this._decisionEditor.prepareDecision();

            const parent = this.get('_parent', false);

            const definitions = parent._definitions;

            if (!definitions) {
                return;
            }

            // open definitions
            const view = parent.getView(definitions);

            parent.open(view);
        };
    }

    open(decision, done) {

        var err;

        // use try/catch to not swallow synchronous exceptions
        // that may be raised during model parsing
        try {

            if (this._decision) {

                // clear existing rendered diagram
                this.clear();
            }

            // update decision
            this._decision = decision;

            // create decision editor
            this._decisionEditor = this.createDecisionEditor();
            this._decisionEditor.parentView = this;
            this._decisionEditor.decisionType = this.getEditorType();
            this._decisionEditor.setDecision(this._decision);
            this._decisionEditor.body = document.body;

        } catch (e) {
            err = e;
            this._decisionEditor.initError = e;
            console.error('Decision editor init error: ', e);
        }

        // handle synchronously thrown exception
        return done(err);
    }

    createDecisionEditor() {
        const editorHtml = this.getEditorHtml();
        let ret = this._container.appendChild(domify(editorHtml));

        return ret;
    }

    getEditorHtml() {
        return `<adi-decision-editor></adi-decision-editor>`;
    }

    getEditorType() {
        throw new Error(`"getEditorType" is not implemented.`);
    }

    /**
 * Initialize the table, returning { modules: [], config }.
 *
 * @param  {Object} options
 *
 * @return {Object} init config
 */
    _init(options) {

        let {
            modules,
            additionalModules,
            ...config
        } = options;

        let baseModules = modules || this.getModules();
        let extraModules = additionalModules || [];
        let staticModules = [
            {
                decision: ['value', this]
            }
        ];

        let allModules = [
            ...baseModules,
            ...extraModules,
            ...staticModules
        ];

        return {
            modules: allModules,
            config
        };
    }

    /**
 * Register an event listener
 *
 * Remove a previously added listener via {@link #off(event, callback)}.
 *
 * @param {string} event
 * @param {number} [priority]
 * @param {Function} callback
 * @param {Object} [that]
 */
    on(event, priority, callback, target) {
        return this.get('eventBus').on(event, priority, callback, target);
    }

    /**
 * De-register an event listener
 *
 * @param {string} event
 * @param {Function} callback
 */
    off(event, callback) {
        this.get('eventBus').off(event, callback);
    }

    /**
 * Emit an event on the underlying {@link EventBus}
 *
 * @param  {string} type
 * @param  {Object} event
 *
 * @return {Object} event processing result (if any)
 */
    _emit(type, event) {
        return this.get('eventBus').fire(type, event);
    }

    /**
 * Attach viewer to given parent node.
 *
 * @param  {Element} parentNode
 */
    attachTo(parentNode) {

        if (!parentNode) {
            throw new Error('parentNode required');
        }

        // ensure we detach from the
        // previous, old parent
        this.detach();

        const container = this._container;

        parentNode.appendChild(container);

        this._emit('attach', {});
    }

    /**
 * Detach viewer from parent node, if attached.
 */
    detach() {

        const container = this._container,
            parentNode = container.parentNode;

        if (!parentNode) {
            return;
        }

        this._emit('detach', {});

        domRemove(container);
    }

    destroy() {
        super.destroy();

        this.detach();
    }

    getModules() {
        return Viewer._getModules();
    }

    static _getModules() {
        return [
        ];
    }

    static _createContainer() {
        return domify(
            `<div class="dmn-adi-decision-editor-container"></div>`
        );
    }
}
