import {
    Component,
    OnInit,
    ViewEncapsulation,
} from '@angular/core';
@Component({
    selector: 'drd-editor',
    templateUrl: './drd-editor.component.html',
    styleUrls: ['./drd-editor.component.scss'],
    encapsulation: ViewEncapsulation.None
})
/**
 * Root DRD editor component.
 */
export class DRDEditorComponent implements OnInit {
    /**
     * Constructor.
     */
    constructor(
    ) {}

    /**
     * Infrastructure initialization.
     */
    public async ngOnInit(): Promise<void> {
    }
}