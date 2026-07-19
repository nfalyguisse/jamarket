import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'annonces/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'messages',
    renderMode: RenderMode.Client,
  },
  {
    path: 'messages/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'admin/**',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
