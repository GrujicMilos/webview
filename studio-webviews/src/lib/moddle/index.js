import { assign } from 'min-dash';
import ColorsPackage from './definitions/flow/colors.json';
import DcPackage from './definitions/flow/dc.json';
import DiPackage from './definitions/flow/di.json';
import FlowPackage from './definitions/flow/flow.json';
import FlowDiPackage from './definitions/flow/flowdi.json';
import FlowModdle from './flow-moddle';

var packages = {
	flow: FlowPackage,
	flowdi: FlowDiPackage,
	dc: DcPackage,
	di: DiPackage,
	bioc: ColorsPackage
};

export default function (additionalPackages, options) {
	var pks = assign({}, packages, additionalPackages);

	return new FlowModdle(pks, options);
}
