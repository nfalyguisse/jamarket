# Jamarket API

API NestJS de **Jamarket Auto** — plateforme d’annonces de véhicules d’occasion pour un garage.

Déployée en production sur **Render** (`https://jamarket-api.onrender.com`).  
Fait partie d’un **monorepo Git** avec le client Angular (`jamarket-client`).

## Stack


| Couche        | Techno                                              |
| ------------- | --------------------------------------------------- |
| Framework     | NestJS 10                                           |
| ORM / BDD     | Prisma 7 + PostgreSQL                               |
| Auth          | JWT (access + refresh) + Passport                   |
| Temps réel    | Socket.IO (`/chat`)                                 |
| Médias        | Cloudinary                                          |
| Observabilité | Prometheus (`prom-client`), Sentry (`@sentry/node`) |
| Docs API      | Swagger                                             |
| Tests         | Vitest                                              |




## Prérequis

- Node.js 20+
- PostgreSQL local (ou une URL External Render)
- Compte Cloudinary (uploads)



## Installation

```bash
cd jamarket-api
cp .env.example .env
# Éditer .env (DATABASE_URL, JWT_*, Cloudinary, seed…)

npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```



## Démarrage

```bash
# Développement (watch)
npm run start:dev

# Production (après build)
npm run build
npm run start:prod
```

L’API écoute par défaut sur `http://localhost:3000` avec le préfixe global `/api`.  
Swagger : `http://localhost:3000/api` (selon config Swagger du projet).

## Scripts utiles


| Script                   | Description                                  |
| ------------------------ | -------------------------------------------- |
| `npm run start:dev`      | API en mode watch                            |
| `npm run build`          | Compilation Nest                             |
| `npm run lint`           | ESLint                                       |
| `npm run test`           | Tests unitaires Vitest                       |
| `npm run test:e2e`       | Tests e2e Vitest                             |
| `npm run audit:deps`     | `npm audit --omit=dev` (dépendances runtime) |
| `npm run prisma:migrate` | Migrations en dev                            |
| `npm run prisma:deploy`  | `migrate deploy` + seed (Render pre-deploy)  |
| `npm run prisma:seed`    | Seed (rôles, catalogue, admin, démo)         |
| `npm run prisma:wipe`    | Vide les tables                              |
| `npm run prisma:reset`   | Wipe + seed                                  |
| `npm run prisma:studio`  | UI Prisma                                    |




## Variables d’environnement

Voir `.env.example`. Principales clés :


| Variable                            | Rôle                                        |
| ----------------------------------- | ------------------------------------------- |
| `DATABASE_URL`                      | Connexion PostgreSQL                        |
| `PORT`                              | Port HTTP (défaut `3000`)                   |
| `CORS_ORIGINS`                      | Origines autorisées (client local / Vercel) |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Secrets JWT                                 |
| `CLOUDINARY_*`                      | Uploads images                              |
| `SENTRY_DSN`                        | Error tracking (optionnel en local)         |
| `SEED_SUPERADMIN_*`                 | Compte admin créé au seed                   |




## Domaines métier (modules)

- **Auth** — inscription, login, refresh, profil
- **Annonces** — CRUD `/api/annonces` (ex-`/api/ads`, renommé pour éviter les adblockers)
- **Catalogue / Search** — filtres et recherche véhicules
- **Véhicules / Upload** — médias Cloudinary
- **Favorites** — favoris utilisateur
- **Chat** — conversations REST + WebSocket Socket.IO
- **Admin** — utilisateurs et rôles
- **Metrics / Health** — `/api/metrics`, `/api/health`



## Observabilité


| Endpoint           | Usage                                                       |
| ------------------ | ----------------------------------------------------------- |
| `GET /api/health`  | Disponibilité API + ping PostgreSQL                         |
| `GET /api/metrics` | Métriques Prometheus (scrape Grafana Alloy → Grafana Cloud) |


Sentry capture les erreurs serveur (filtre HTTP 5xx, Cloudinary, WebSocket).  
Les 4xx attendues ne génèrent pas d’Issue (éviter le bruit).

## Déploiement (Render)

1. Build : `npm install && npm run build`
2. Pre-deploy : `npm run prisma:deploy`
3. Start : `npm run start:prod`
4. Variables d’environnement Render alignées sur `.env.example` (prod)



## Documentation liée

- `docs/` (racine monorepo) — processus de déploiement, supervision, anomalies
- `CHANGELOG.md` — versions SemVer (`v0.2.0`, `v0.3.0`, `v0.3.1`…)

