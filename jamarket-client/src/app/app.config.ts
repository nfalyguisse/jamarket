import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { ApplicationConfig, ErrorHandler, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { createErrorHandler } from '@sentry/angular';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { sentryHttpInterceptor } from '@core/interceptors/sentry-http.interceptor';
import { provideRouter } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { routes } from './app.routes';

registerLocaleData(localeFr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, sentryHttpInterceptor]),
    ),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    { provide: ErrorHandler, useValue: createErrorHandler({ showDialog: false }) },
    { provide: LOCALE_ID, useValue: 'fr-FR' },
  ],
};
