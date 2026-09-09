# Jamarket Client

Front Angular de **Jamarket Auto** — plateforme d’annonces de véhicules d’occasion pour un garage.

Déployé en production sur **Vercel** (`https://jamarket-kappa.vercel.app`).  
Fait partie d’un **monorepo Git** avec l’API NestJS (`jamarket-api`).

## Stack


| Couche        | Techno                               |
| ------------- | ------------------------------------ |
| Framework     | Angular 20                           |
| Styles        | Tailwind CSS 4                       |
| Temps réel    | Socket.IO client (messagerie)        |
| Observabilité | Sentry (`@sentry/angular`)           |
| UI            | Lucide icons, SweetAlert2            |
| Build         | Angular CLI / Vite (builder Angular) |


## Prérequis

- Node.js 20+
- API `jamarket-api` démarrée (ou URL Render)



## Installation

```bash
cd jamarket-client
cp .env.example .env
# Éditer .env (API_URL, CDN_URL, éventuellement SENTRY_DSN)

npm install
```

Au `postinstall` / `prestart` / `prebuild`, le script `scripts/generate-env.mjs` génère automatiquement `src/environments/*.ts` à partir de `.env` (ou des variables Vercel). **Ne pas éditer ni committer** ces fichiers générés.

## Démarrage

```bash
# Développement (http://localhost:4200)
npm start

# Staging
npm run start:staging
```



## Build

```bash
npm run build                 # config development / défaut
npm run build:staging
npm run build:production      # build Vercel / prod
```

Artefacts dans `dist/`.

## Scripts utiles


| Script                     | Description                         |
| -------------------------- | ----------------------------------- |
| `npm start`                | `ng serve` + génération env         |
| `npm run build:production` | Build production                    |
| `npm run env:generate`     | Régénère les fichiers `environment` |
| `npm test`                 | Tests unitaires (Karma / Jasmine)   |




## Variables d’environnement

Voir `.env.example`. Principales clés :


| Variable     | Rôle                                                                |
| ------------ | ------------------------------------------------------------------- |
| `API_URL`    | Base URL de l’API **avec** `/api` (ex. `http://localhost:3000/api`) |
| `CDN_URL`    | Origine médias / API **sans** `/api`                                |
| `SENTRY_DSN` | Error tracking browser (optionnel en local)                         |


Sur **Vercel** : définir `API_URL` et `CDN_URL` dans *Project → Settings → Environment Variables* (pas de fichier `.env` sur le serveur).

Exemple production :

```env
API_URL=https://jamarket-api.onrender.com/api
CDN_URL=https://jamarket-api.onrender.com
```



## Fonctionnalités (features)


| Feature       | Description                              |
| ------------- | ---------------------------------------- |
| **Home**      | Page d’accueil                           |
| **Catalogue** | Liste + filtres / recherche              |
| **Annonces**  | Fiche détail (`/annonces/:id`)           |
| **Auth**      | Login / register                         |
| **Profil**    | Consultation et édition                  |
| **Favoris**   | Annonces favorites                       |
| **Messages**  | Chat client ↔ vendeur (REST + WebSocket) |


> Note : les routes API métier utilisent `/api/annonces` (et non `/api/ads`) pour éviter le blocage `ERR_BLOCKED_BY_CLIENT` des adblockers.



## Observabilité (Sentry)

Le SDK `@sentry/angular` est branché via :

- initialisation dans la config Angular ;
- intercepteur HTTP (`sentryHttpInterceptor`) pour les erreurs réseau / 5xx ;
- `ErrorHandler` pour les exceptions front non gérées.

Les 4xx attendues (login, validation) ne sont pas remontées.  
Les bloqueurs publicitaires peuvent encore filtrer `*.ingest.sentry.io` ; un tunnel via l’API est prévu en amélioration.

## Déploiement (Vercel)

1. Build command : `npm run build:production` (ou équivalent projet)
2. Variables `API_URL`, `CDN_URL`, `SENTRY_DSN`
3. Déploiement automatique à chaque merge sur la branche suivie



## Documentation liée

- `jamarket-api/README.md` — API Nest
- `docs/` (racine monorepo) — déploiement, supervision, anomalies
- `CHANGELOG.md` — versions SemVer



