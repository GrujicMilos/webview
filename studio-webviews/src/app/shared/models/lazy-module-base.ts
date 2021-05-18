import { Injector, Type } from '@angular/core';

/**
 * Base class for lazy loaded modules.
 */
export abstract class LazyModuleBase {
    /**
     * Constructor.
     */
    constructor(protected injector: Injector) {}

    /**
     * Gets component constructor by component name.
     *
     * @param name Component name.
     * @returns Component constructor.
     */
    public getTypeByName(name: string): Type<any> {
        return this.componentTypes[name];
    }

    /**
     * Module initialization.
     *
     * @param args Init arguments.
     */
    public async init(...args: any[]): Promise<void> {}

    protected abstract get componentTypes(): Record<string, Type<any>>;
}
