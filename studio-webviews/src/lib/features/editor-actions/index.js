import AlignElementsModule from 'diagram-js/lib/features/align-elements';
import EditorActionsModule from 'diagram-js/lib/features/editor-actions';
import HandToolModule from 'diagram-js/lib/features/hand-tool';
import LassoToolModule from 'diagram-js/lib/features/lasso-tool';
import SpaceToolModule from 'diagram-js/lib/features/space-tool';
import DirectEditingModule from 'diagram-js-direct-editing';
import GlobalConnectModule from '../global-connect';

import FlowEditorActions from './FlowEditorActions';

export default {
	__depends__: [
		AlignElementsModule,
		EditorActionsModule,
		HandToolModule,
		LassoToolModule,
		SpaceToolModule,
		DirectEditingModule,
		GlobalConnectModule
	],
	editorActions: ['type', FlowEditorActions]
};
