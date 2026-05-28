import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/pages/home-page/home-page.component').then((m) => m.HomePageComponent),
    title: 'Jamarket Auto | Véhicules d\'occasion',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
