/* eslint-disable*/

import AdiBaseViewer from '../../dmn-js-shared/src/base/viewer/AdiBaseViewer';

export class ContextExpressionViewer extends AdiBaseViewer {

    constructor(options = {}) {
        super(options);
    }
    
    getEditorType() {
        return 'context-expression';
    }
}
