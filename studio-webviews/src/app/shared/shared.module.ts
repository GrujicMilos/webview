import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgJsonEditorModule } from 'ang-jsoneditor';
import { AngularSplitModule } from 'angular-split';
import { ContextMenuModule } from 'ngx-contextmenu';
import { DndModule } from 'ngx-drag-drop';
import { CollapseSplitAreaComponent } from './components/collapse-split-area/collapse-split-area.component';

@NgModule({
    declarations: [
        CollapseSplitAreaComponent,
    ],
    exports: [
        CollapseSplitAreaComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        HttpClientModule,
        //
        AngularSplitModule,
        ContextMenuModule,
        DndModule,
        NgbModule,
        NgJsonEditorModule.forRoot(),
        NgSelectModule,
    ],
})
/**
 * Module containing shared functionalities and models.
 */
export class SharedModule {
    /**
     * Constructor.
     */
    constructor() {
        console.log('SharedModule constructor.');
    }
}
