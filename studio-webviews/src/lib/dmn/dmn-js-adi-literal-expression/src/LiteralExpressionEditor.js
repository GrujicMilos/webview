import { LiteralExpressionViewer } from './LiteralExpressionViewer';

export class LiteralExpressionEditor extends LiteralExpressionViewer {

  getModules() {
    return [
      ...LiteralExpressionViewer._getModules(),
      ...LiteralExpressionEditor._getModules()
    ];
  }

  static _getModules() {
    return [
    ];
  }

}
