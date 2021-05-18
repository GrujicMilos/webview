
import AdiBaseViewer from '../../dmn-js-shared/src/base/viewer/AdiBaseViewer';

export class DecisionTableViewer extends AdiBaseViewer {

    constructor(options = {}) {
        super(options);
    }
    
    getEditorType() {
        return 'decision-table';
    }
}
