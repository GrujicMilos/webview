import { NgModuleFactory, Type } from '@angular/core';
import { WebviewModule } from './models/component-factory-loader.models';

const lazyModules: {
    path: string;
    loadChildren: () => Promise<NgModuleFactory<any> | Type<any>>;
}[] = [
    {
        path: WebviewModule.DMNEditor,
        loadChildren: (): Promise<NgModuleFactory<any> | Type<any>> =>
            import('../dmn-editor/dmn-editor.module').then((m) => m.DMNEditorModule),
    },
];

/**
 * Converts lazy data from array to object.
 */
export function lazyArrayToObj(): any {
    const result = {};

    for (const w of lazyModules) {
        result[w.path] = w.loadChildren;
    }

    return result;
}
