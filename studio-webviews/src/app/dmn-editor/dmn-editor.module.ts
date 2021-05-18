import { CommonModule } from '@angular/common';
import { Injector, NgModule, Type } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgOptionHighlightModule } from '@ng-select/ng-option-highlight';
import { NgSelectModule } from '@ng-select/ng-select';
import { AngularSplitModule } from 'angular-split';
import { DRDEditorComponent } from './components/drd-editor/drd-editor.component';
import { ContextMenuModule } from 'ngx-contextmenu';
import { DndModule } from 'ngx-drag-drop';
import { LazyModuleBase } from '../shared/models/lazy-module-base';
import { SharedModule } from '../shared/shared.module';

@NgModule({
    declarations: [
        DRDEditorComponent,
    ],

    imports: [
        CommonModule,
        FormsModule,
        //
        DndModule,
        AngularSplitModule,
        ContextMenuModule,
        NgbModule,
        NgSelectModule,
        SharedModule,
        NgOptionHighlightModule,
    ],

    providers: [],
})
/**
 * DMN editor module.
 */
export class DMNEditorModule extends LazyModuleBase {
    /**
     * Constructor.
     */
    constructor(injector: Injector) {
        super(injector);

        let element: any = createCustomElement(DRDEditorComponent, { injector });
        customElements.define('adi-decision-editor', element);

        element = createCustomElement(DRDEditorComponent, { injector });
        customElements.define('adi-decision-table', element);
    }

    /**
     * Abstract property implementation.
     */
    protected get componentTypes(): Record<string, Type<any>> {
        return {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            DMNEditor: DRDEditorComponent,
        };
    }
}
