declare const webviewInitRoute: string;
declare const webviewInitRouteExtras: any;
declare const editorSettings: any;
// this will override webpack's `publicPath` so chunks can be loaded when running inside VSCode
declare let __webpack_public_path__: any;
// eslint-disable-next-line prefer-const
__webpack_public_path__ = (window as any).__adinsure__extension__webviews__ || '';

import { DOCUMENT, Location } from '@angular/common';
import {
    AfterViewInit,
    Component,
    ComponentFactory,
    ComponentFactoryResolver,
    ComponentRef,
    Inject,
    OnDestroy,
    ViewChild,
    ViewContainerRef,
} from '@angular/core';
import {
    ComponentFactoryLoader,
    COMPONENT_FACTORY_LOADER,
    WebviewModule,
} from './shared/models/component-factory-loader.models';

const routeToModuleMapping: any = {
    'code-table-editor': WebviewModule.CodeTableEditor,
    'document-configuration-editor': WebviewModule.DocumentConfigurationEditor,
    'data-schema-editor': WebviewModule.DataSchemaEditor,
    'dmn-editor': WebviewModule.DMNEditor,
    'document-flow-editor': WebviewModule.DocumentFlowEditor,
    'general-properties-editor': WebviewModule.GeneralPropertiesEditor,
    'ui-schema-editor': WebviewModule.UISchemaEditor,
};

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
/**
 * Root application component.
 */
export class AppComponent implements AfterViewInit, OnDestroy {
    @ViewChild('container', { read: ViewContainerRef }) public container: any;

    private _componentRef: ComponentRef<any>;

    /**
     * Constructor.
     */
    constructor(
        protected resolver: ComponentFactoryResolver,
        private _location: Location,
        @Inject(DOCUMENT) private _document: Document,
        @Inject(COMPONENT_FACTORY_LOADER) private _componentFactoryLoader: ComponentFactoryLoader
    ) {
        console.log('AppComponent constructor.');
    }

    /**
     * Creates required editor component.
     */
    public async ngAfterViewInit(): Promise<void> {
        console.log(
            `AppComponent ngAfterViewInit,  init route: [${webviewInitRoute}], extras: [${webviewInitRouteExtras}].`
        );
        console.log(`__webpack_public_path__ = [${__webpack_public_path__}]`);

        let routeToNavigate: string;

        // if `webviewInitRoute` is present it means that app is running inside VSCode, navigate to provided route
        if (webviewInitRoute) {
            routeToNavigate = webviewInitRoute;
        } else {
            this._document.body.classList.add('vscode-dark');
            const p = this._location.path().split(`?`)[0];
            routeToNavigate = p.split('/')[1];
        }

        if (routeToNavigate) {
            if (routeToNavigate.startsWith('/')) {
                routeToNavigate = routeToNavigate.substring(1);
            }

            const moduleName: string = routeToModuleMapping[routeToNavigate];
            if (!moduleName) {
                throw new Error(`Can't find application module for route [${routeToNavigate}].`);
            }

            const componentFactory = await this._componentFactoryLoader.load(
                moduleName,
                moduleName
            );
            this.createComponent(componentFactory);
        }
    }

    /**
     * Infrastructure destroy event handler.
     */
    public ngOnDestroy(): void {
        if (this._componentRef) {
            this._componentRef.destroy();
        }
    }

    /**
     * Creates component using provided factory.
     *
     * @param componentFactory Component factory.
     */
    protected createComponent(componentFactory: ComponentFactory<any>): void {
        this.container.clear();
        this._componentRef = this.container.createComponent(componentFactory);
        this._componentRef.instance.editorSettings = editorSettings;
    }
}
