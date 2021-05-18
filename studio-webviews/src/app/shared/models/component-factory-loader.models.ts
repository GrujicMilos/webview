import { InjectionToken } from '@angular/core';

export const LAZY_MODULES_DATA = new InjectionToken<{ [key: string]: string }>('LAZY_MODULES_DATA');

export const COMPONENT_FACTORY_LOADER = new InjectionToken<ComponentFactoryLoader>(
    'COMPONENT_FACTORY_LOADER'
);

export interface ComponentFactoryLoader {
    load(moduleName: string, componentName: string): Promise<any>;
}

export enum WebviewModule {
    CodeTableEditor = 'CodeTableEditor',
    DataSchemaEditor = 'DataSchemaEditor',
    DMNEditor = 'DMNEditor',
    DocumentConfigurationEditor = 'DocumentConfigurationEditor',
    DocumentFlowEditor = 'DocumentFlowEditor',
    GeneralPropertiesEditor = 'GeneralPropertiesEditor',
    UISchemaEditor = 'UISchemaEditor',
}
