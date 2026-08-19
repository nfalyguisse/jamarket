import { bootstrapApplication } from '@angular/platform-browser';
import { initSentry } from '@core/sentry/sentry';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

initSentry({
  dsn: environment.sentryDsn,
  production: environment.production,
});

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
