import { classes as domClasses, delegate as domDelegate, domify } from 'min-dom';
import { is } from '../../../../dmn-js-shared/src/util/ModelUtil';

const PROVIDERS = [
  {
    className: 'dmn-icon-decision-table',
    matches: function (el) {
      const businessObject = el.businessObject;

      return (
        is(businessObject, 'dmn:Decision') &&
        is(businessObject.decisionLogic, 'dmn:DecisionTable')
      );
    },
  },
  {
    className: 'dmn-icon-literal-expression',
    matches: function (el) {
      const businessObject = el.businessObject;

      return (
        is(businessObject, 'dmn:Decision') &&
        is(businessObject.decisionLogic, 'dmn:LiteralExpression')
      );
    },
  },
  {
    className: 'dmn-icon-context-expression',
    matches: function (el) {
      const businessObject = el.businessObject;

      return (
        is(businessObject, 'dmn:Decision') &&
        is(businessObject.decisionLogic, 'dmn:Context')
      );
    },
  },
  {
    className: 'dmn-icon-external-link',
    matches: function (el) {
      const businessObject = el.businessObject;

      return (
        is(businessObject, 'dmn:BusinessKnowledgeModel') && businessObject.lib !== undefined
      );
    },
  },
];

/**
 * Displays overlays that can be clicked in order to drill
 * down into a DMN element.
 */
export default class DrillDown {
  constructor(injector, eventBus, overlays, config) {
    this._injector = injector;
    this._eventBus = eventBus;
    this._overlays = overlays;

    this._config = config || { enabled: true };

    eventBus.on(['shape.added', 'adInsure.setLibrary'], ({ element }) => {
      for (let i = 0; i < PROVIDERS.length; i++) {
        const { matches, className } = PROVIDERS[i];

        const editable = matches && matches(element);

        if (editable) {
          this.addOverlay(element, className);
        }
      }
    });
  }

  /**
   * Add overlay to an element that enables drill down.
   *
   * @param {Object} element Element to add overlay to.
   * @param {string} className
   *        CSS class that will be added to overlay in order to display icon.
   */
  addOverlay(element, className) {
    const html = domify(`
      <div class="drill-down-overlay ${className}">
      </div>
    `);

    const overlayId = this._overlays.add(element, {
      position: {
        top: 2,
        left: 2,
      },
      html,
    });

    // TODO(nikku): can we remove renamed to drillDown.enabled
    if (this._config.enabled !== false) {
      domClasses(html).add('interactive');

      this.bindEventListener(element, html, overlayId);
    }
  }

  /**
   * @param {Object} element
   * @param {Object} overlay
   * @param {string} id
   */
  bindEventListener(element, overlay, id) {
    const overlays = this._overlays,
      eventBus = this._eventBus;

    const overlaysRoot = overlays._overlayRoot;

    domDelegate.bind(overlaysRoot, '[data-overlay-id="' + id + '"]', 'click', () => {
      const triggerDefault = eventBus.fire('drillDown.click', {
        element,
      });

      if (triggerDefault === false) {
        return;
      }

      this.drillDown(element);
    });
  }

  /**
   * Drill down into the specific element.
   *
   * @param  {djs.model.Base} element
   *
   * @return {boolean} whether drill down was executed
   */
  drillDown(element) {
    const parent = this._injector.get('_parent', false);

    // no parent; skip drill down
    if (!parent) {
      return false;
    }

    const view = parent.getView(element.businessObject);

    // no view to drill down to
    if (!view) {
      return false;
    }

    parent.open(view);

    return true;
  }
}

DrillDown.$inject = ['injector', 'eventBus', 'overlays', 'config.drillDown'];
