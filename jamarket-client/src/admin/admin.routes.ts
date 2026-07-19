import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';
import { superAdminGuard } from './guards/super-admin.guard';

export const adminRoutes: Routes = [
  {
    path: 'connexion',
    loadComponent: () =>
      import('./features/auth/pages/admin-login-page/admin-login-page.component').then(
        (m) => m.AdminLoginPageComponent,
      ),
    title: 'Connexion | Jamarket Back Office',
  },
  {
    path: '',
    canActivate: [adminGuard],
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
        path: 'annonces/nouvelle',
        loadComponent: () =>
          import('./features/ads/pages/ad-form-page/ad-form-page.component').then(
            (m) => m.AdFormPageComponent,
          ),
        title: 'Nouvelle annonce | Jamarket Back Office',
      },
      {
        path: 'annonces/:id/modifier',
        loadComponent: () =>
          import('./features/ads/pages/ad-form-page/ad-form-page.component').then(
            (m) => m.AdFormPageComponent,
          ),
        title: 'Modifier annonce | Jamarket Back Office',
      },
      {
        path: 'utilisateurs',
        canActivate: [superAdminGuard],
        loadComponent: () =>
          import('./features/users/pages/users-list-page/users-list-page.component').then(
            (m) => m.UsersListPageComponent,
          ),
        title: 'Utilisateurs | Jamarket Back Office',
      },
      {
        path: 'roles',
        canActivate: [superAdminGuard],
        loadComponent: () =>
          import('./features/roles/pages/roles-list-page/roles-list-page.component').then(
            (m) => m.RolesListPageComponent,
          ),
        title: 'Gestion des rôles | Jamarket Back Office',
      },
      {
        path: 'parametres',
        loadComponent: () =>
          import('./features/profile/pages/admin-profile-page/admin-profile-page.component').then(
            (m) => m.AdminProfilePageComponent,
          ),
        title: 'Mon profil | Jamarket Back Office',
      },
      {
        path: 'messages',
        loadComponent: () =>
          import('./features/messages/pages/admin-messages-page/admin-messages-page.component').then(
            (m) => m.AdminMessagesPageComponent,
          ),
        title: 'Messages | Jamarket Back Office',
      },
    ],
  },
];
