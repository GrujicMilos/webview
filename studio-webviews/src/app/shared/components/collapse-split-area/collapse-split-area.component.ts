import { Component, Host, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { SplitAreaDirective, SplitComponent } from 'angular-split';

@Component({
    selector: 'collapse-split-area',
    templateUrl: './collapse-split-area.component.html',
    styleUrls: ['./collapse-split-area.component.scss'],
    encapsulation: ViewEncapsulation.None,
    providers: [SplitComponent, SplitAreaDirective ]
})
/**
 * Collapsible split area.
 */
export class CollapseSplitAreaComponent implements OnInit {
    @Input()
    public initiallyCollapsed: boolean | undefined;

    @Input()
    public titleCallback: () => string;

    // whether area is collapsed
    public collapsed = false;
    // collapse direction; determines position of the collapse/expand button
    public collapseDirection: 'horizontal' | 'vertical' = 'horizontal';

    /**
     * Constructor.
     */
    constructor(
        @Host() private readonly _parentSplit: SplitComponent,
        @Host() private readonly _parentSplitArea: SplitAreaDirective
    ) {
        this.collapseDirection = _parentSplit.direction;
    }

    /**
     * Gets the title of the collapse split area.
     */
    public get title(): string {
        return this.titleCallback ? this.titleCallback() : '';
    }

    /**
     * Infrastructure initialization.
     */
    public ngOnInit(): void {
        if (this.initiallyCollapsed === true) {
            setTimeout(() => this.onCollapse(), 0);
        }
    }

    /**
     * Handles collapsing property grid
     */
    public onCollapse(): void {
        this.collapsed = true;
        const newSize = this.collapseDirection === 'horizontal' ? 40 : 30;
        this._parentSplitArea.collapse(newSize, 'left');
    }
    /**
     * Handles expanding property grid
     */
    public onExpand(): void {
        this.collapsed = false;
        this._parentSplitArea.expand();
    }
}
