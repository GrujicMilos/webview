import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

// this will override webpack's `publicPath` so chunks can be loaded when running inside VSCode
declare let __webpack_public_path__: any;
__webpack_public_path__ = (window as any).__adinsure__extension__webviews__ || '';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
