/* eslint-disable */
import { ContextExpressionEditor } from '../../dmn-js-adi-context-expression/src/ContextExpressionEditor';
import { DecisionTableEditor } from '../../dmn-js-adi-decision-table/src/DecisionTableEditor';
import DrdModeler from '../../dmn-js-drd/src/Modeler';
import EditingManager from '../../dmn-js-shared/src/base/EditingManager';
import { LiteralExpressionEditor } from '../../dmn-js-adi-literal-expression/src/LiteralExpressionEditor';
import { is } from '../../dmn-js-shared/src/util/ModelUtil';

/**
 * The dmn editor.
 */
export default class Modeler extends EditingManager {

    constructor(options){
        super(options);
    }

    _getViewProviders() {

        return [
            {
                id: 'drd',
                constructor: DrdModeler,
                opens: 'dmn:Definitions'
            },
            {
                id: 'decisionTable',
                constructor: DecisionTableEditor,
                opens(element) {
                    return (
                        is(element, 'dmn:Decision') &&
                        is(element.decisionLogic, 'dmn:DecisionTable')
                    );
                }
            },
            {
                id: 'literalExpression',
                constructor: LiteralExpressionEditor,
                opens(element) {
                    return (
                        is(element, 'dmn:Decision') &&
                        is(element.decisionLogic, 'dmn:LiteralExpression')
                    );
                }
            },
            {
                id: 'contextExpression',
                constructor: ContextExpressionEditor,
                opens(element) {
                    return (
                        is(element, 'dmn:Decision') &&
                        is(element.decisionLogic, 'dmn:Context')
                    );
                }
            }
        ];

    }

    _getInitialView(views) {

        var definitionsView;

        // todo: check single decision
        for (var i = 0; i < views.length; i++) {

            const view = views[i];
            const el = view.element;

            if (is(el, 'dmn:Definitions')) {
                definitionsView = view;

                // if (containsDi(el)) {
                //   return view;
                // }
            }
        }

        return definitionsView || views[0]
    }

    _getDecisionViews(views) {
        var decisionViews = [];

        // todo: check single decision
        for (var i = 0; i < views.length; i++) {

            const view = views[i];
            const el = view.element;

            if (is(el, 'dmn:Decision')) {
                // return view;
                decisionViews.push(view);
            }
        }

        return decisionViews;

    }

}
