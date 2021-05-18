import {
    Compiler,
    Inject,
    Injectable,
    Injector,
    NgModuleFactory,
    NgModuleRef,
    Type,
} from '@angular/core';
import {
    ComponentFactoryLoader,
    LAZY_MODULES_DATA,
} from '../models/component-factory-loader.models';

@Injectable()
/** */
export class LazyComponentFactoryLoaderService implements ComponentFactoryLoader {
    /**
     * Constructor
     */
    constructor(
        private _injector: Injector,
        private _compiler: Compiler,
        @Inject(LAZY_MODULES_DATA)
        private _lazyModulesData: { [key: string]: () => Promise<NgModuleFactory<any> | Type<any>> }
    ) {}

    /**
     * Loads module by name and finds component factory.
     *
     * @param moduleName Name of the module to load.
     * @param componentName Name of the component to find factory for.
     */
    public async load(moduleName: string, componentName: string): Promise<any> {
        const moduleTypeOrFactory: NgModuleFactory<any> | Type<any> = await this._lazyModulesData[
            moduleName
        ]();

        let moduleFactory: NgModuleFactory<any>;

        if (moduleTypeOrFactory instanceof NgModuleFactory) {
            // For AOT
            moduleFactory = moduleTypeOrFactory;
        } else {
            // For JIT
            moduleFactory = await this._compiler.compileModuleAsync(moduleTypeOrFactory);
        }

        const moduleRef: NgModuleRef<any> = moduleFactory.create(this._injector);
        await moduleRef.instance.init(this._injector);

        const componentType: Type<any> = moduleRef.instance.getTypeByName(componentName);

        return moduleRef.componentFactoryResolver.resolveComponentFactory(componentType);
    }
}
