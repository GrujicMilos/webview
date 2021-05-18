import { DecisionTableViewer } from './DecisionTableViewer';

export class DecisionTableEditor extends DecisionTableViewer {

  getModules() {
    return [
      ...DecisionTableViewer._getModules(),
      ...DecisionTableEditor._getModules()
    ];
  }

  static _getModules() {
    return [
    ];
  }

}
