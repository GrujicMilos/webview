import CommandModule from 'diagram-js/lib/command';
import AttachSupportModule from 'diagram-js/lib/features/attach-support';
import ChangeSupportModule from 'diagram-js/lib/features/change-support';
import LabelSupportModule from 'diagram-js/lib/features/label-support';
import SelectionModule from 'diagram-js/lib/features/selection';
import SpaceToolModule from 'diagram-js/lib/features/space-tool';
import TooltipsModule from 'diagram-js/lib/features/tooltips';
import CroppingConnectionDocking from 'diagram-js/lib/layout/CroppingConnectionDocking';
import OrderingModule from '../ordering';
import RulesModule from '../rules';
import BehaviorModule from './behavior';
import ElementFactory from './ElementFactory';
import FlowFactory from './FlowFactory';
import FlowLayouter from './FlowLayouter';
import FlowUpdater from './FlowUpdater';
import Modeling from './Modeling';

export default {
	__init__: [
		'modeling',
		'flowUpdater'
	],
	__depends__: [
		BehaviorModule,
		RulesModule,
		OrderingModule,
		CommandModule,
		TooltipsModule,
		LabelSupportModule,
		AttachSupportModule,
		SelectionModule,
		ChangeSupportModule,
		SpaceToolModule
	],
	flowFactory: ['type', FlowFactory],
	flowUpdater: ['type', FlowUpdater],
	elementFactory: ['type', ElementFactory],
	modeling: ['type', Modeling],
	layouter: ['type', FlowLayouter],
	connectionDocking: ['type', CroppingConnectionDocking]
};
