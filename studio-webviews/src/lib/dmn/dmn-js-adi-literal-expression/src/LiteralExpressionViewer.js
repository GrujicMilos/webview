import AdiBaseViewer from '../../dmn-js-shared/src/base/viewer/AdiBaseViewer';

export class LiteralExpressionViewer extends AdiBaseViewer {

    constructor(options = {}) {
        super(options);
    }
    
    getEditorType() {
        return `literal-expression`;
    }
}
