import { ContextExpressionViewer } from './ContextExpressionViewer';

export class ContextExpressionEditor extends ContextExpressionViewer {

  getModules() {
    return [
      ...ContextExpressionViewer._getModules(),
      ...ContextExpressionEditor._getModules()
    ];
  }

  static _getModules() {
    return [
    ];
  }

}
