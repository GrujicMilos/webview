import CreateModule from 'diagram-js/lib/features/create';
import HandToolModule from 'diagram-js/lib/features/hand-tool';
import LassoToolModule from 'diagram-js/lib/features/lasso-tool';
import PaletteModule from 'diagram-js/lib/features/palette';
import SpaceToolModule from 'diagram-js/lib/features/space-tool';
import translate from 'diagram-js/lib/i18n/translate';
import GlobalConnectModule from '../global-connect';
import PaletteProvider from './PaletteProvider';

export default {
	__depends__: [
		PaletteModule,
		CreateModule,
		SpaceToolModule,
		LassoToolModule,
		HandToolModule,
		translate,
		GlobalConnectModule
	],
	__init__: ['paletteProvider'],
	paletteProvider: ['type', PaletteProvider]
};
