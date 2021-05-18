/* eslint-disable */
import ContextExpressionViewer from '../../dmn-js-context-expression/src/Viewer';
import DecisionTableViewer from '../../dmn-js-adi-decision-table/src/Viewer';
import DrdViewer from '../../dmn-js-drd/src/Viewer';
import LiteralExpressionViewer from '../../dmn-js-adi-literal-expression/src/Viewer';
import Manager from '../../dmn-js-shared/src/base/Manager';
import { containsDi } from '../../dmn-js-shared/src/util/DiUtil';
import { is } from '../../dmn-js-shared/src/util/ModelUtil';

/**
 * The dmn viewer.
 */
export default class Viewer extends Manager {

    _getViewProviders() {

        return [
            {
                id: 'drd',
                constructor: DrdViewer,
                opens(element) {
                    return is(element, 'dmn:Definitions') && containsDi(element);
                }
            },
            {
                id: 'decisionTable',
                constructor: DecisionTableViewer,
                opens(element) {
                    return (
                        is(element, 'dmn:Decision') &&
                        is(element.decisionLogic, 'dmn:DecisionTable')
                    );
                }
            },
            {
                id: 'literalExpression',
                constructor: LiteralExpressionViewer,
                opens(element) {
                    return (
                        is(element, 'dmn:Decision') &&
                        is(element.decisionLogic, 'dmn:LiteralExpression')
                    );
                }
            },
            {
                id: 'contextExpression',
                constructor: ContextExpressionViewer,
                opens(element) {
                    return (
                        is(element, 'dmn:Decision') &&
                        is(element.decisionLogic, 'dmn:Context')
                    );
                }
            }
        ];

    }

}
