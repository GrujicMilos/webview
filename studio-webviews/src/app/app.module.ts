import { Location, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';
import { ContextMenuModule } from 'ngx-contextmenu';
import { AppComponent } from './app.component';
import { lazyArrayToObj } from './shared/lazy-modules-data';
import {
    COMPONENT_FACTORY_LOADER,
    LAZY_MODULES_DATA,
} from './shared/models/component-factory-loader.models';
import { LazyComponentFactoryLoaderService } from './shared/services/lazy-component-factory-loader.service';
import { SharedModule } from './shared/shared.module';

const routes: Routes = [
    {
        path: '**',
        component: AppComponent,
    },
];

@NgModule({
    declarations: [AppComponent],

    imports: [
        NoopAnimationsModule,
        HttpClientModule,
        FormsModule,
        RouterModule.forRoot(routes),
        ContextMenuModule.forRoot({
            useBootstrap4: true,
        }),
        SharedModule,
    ],
    providers: [
        Location,
        {
            provide: LocationStrategy,
            useClass: PathLocationStrategy,
        },
        {
            provide: LAZY_MODULES_DATA,
            useFactory: lazyArrayToObj,
        },
        {
            provide: COMPONENT_FACTORY_LOADER,
            useClass: LazyComponentFactoryLoaderService,
        },
    ],

    exports: [RouterModule],

    bootstrap: [AppComponent],
})
/**
 * Main application module.
 */
export class AppModule {
    /**
     * Constructor.
     */
    constructor() {
        console.log('App module constructor.');
    }
}
