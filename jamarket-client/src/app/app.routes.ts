import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/pages/home-page/home-page.component').then((m) => m.HomePageComponent),
    title: 'Jamarket Auto | Véhicules d\'occasion',
  },
  {
    path: 'connexion',
    loadComponent: () =>
      import('./features/auth/pages/login-page/login-page.component').then((m) => m.LoginPageComponent),
    title: 'Connexion | Jamarket Auto',
  },
  {
    path: 'inscription',
    loadComponent: () =>
      import('./features/auth/pages/register-page/register-page.component').then(
        (m) => m.RegisterPageComponent,
      ),
    title: 'Inscription | Jamarket Auto',
  },
  {
    path: 'profil',
    loadComponent: () =>
      import('./features/profile/pages/profile-page/profile-page.component').then(
        (m) => m.ProfilePageComponent,
      ),
    title: 'Mon profil | Jamarket Auto',
  },
  {
    path: 'profil/modifier',
    loadComponent: () =>
      import('./features/profile/pages/edit-profile-page/edit-profile-page.component').then(
        (m) => m.EditProfilePageComponent,
      ),
    title: 'Modifier mon profil | Jamarket Auto',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
