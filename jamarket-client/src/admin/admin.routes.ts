import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/admin-layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard-page/dashboard-page.component').then(
            (m) => m.DashboardPageComponent,
          ),
        title: 'Tableau de bord | Jamarket Back Office',
      },
      {
        path: 'annonces',
        loadComponent: () =>
          import('./features/ads/pages/ads-list-page/ads-list-page.component').then(
            (m) => m.AdsListPageComponent,
          ),
        title: 'Annonces | Jamarket Back Office',
      },
      {
        path: 'utilisateurs',
        loadComponent: () =>
          import('./features/users/pages/users-list-page/users-list-page.component').then(
            (m) => m.UsersListPageComponent,
          ),
        title: 'Utilisateurs | Jamarket Back Office',
      },
    ],
  },
];
