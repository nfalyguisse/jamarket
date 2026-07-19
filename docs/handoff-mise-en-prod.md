# Résumé handoff — Mise en prod Jamarket (Vercel + Render)

> Contexte à transmettre à une autre IA / agent.  
> Projet monorepo : `jamarket-client` (Angular) + `jamarket-api` (NestJS + Prisma/PostgreSQL).

---

## Architecture de déploiement (écart budget)

**Prévu (bloc 1)** : VPS Infomaniak + Docker (front + API + DB).

**Réalisé** :

| Composant | Hébergeur | URL / service |
|-----------|-----------|----------------|
| Front Angular | **Vercel** | `https://jamarket-kappa.vercel.app` (SPA/CSR, pas de SSR runtime) |
| API NestJS | **Render** (free) | `https://jamarket-api.onrender.com` |
| PostgreSQL | **Render Postgres** (free) | service `jamarket_db` (Frankfurt) |

Doc d’écart déjà rédigée : [`ecart-architecture-deploiement.md`](./ecart-architecture-deploiement.md)

---

## Front Vercel — points clés

- **Root Directory** : `jamarket-client`
- **Output** : `dist/jamarket-client/browser` (Angular 17+)
- Fichier `jamarket-client/vercel.json` : `outputDirectory` + rewrite SPA → `index.html`
- Les fichiers `environment*.ts` sont **générés** au build via `scripts/generate-env.mjs` (`postinstall` / `prebuild`), **non commités** (gitignore)
- Variables Vercel (Environment = **Production**, puis **Redeploy**) :
  - `API_URL` = `https://jamarket-api.onrender.com/api` ← aussi utilisée pour Socket.IO `/chat`
  - `CDN_URL` = `https://jamarket-api.onrender.com` (origine API ; pas de CDN objet pour l’instant)
  - Sans ces vars au build, le front tombe sur `localhost:3000` → WS cassé en prod
- SSR Angular **ignoré** volontairement (trop fragile / coûteux sur Vercel)
- Routes API annonces : préfixe **`/api/annonces`** (pas `/api/ads` — bloqué par adblockers : `ERR_BLOCKED_BY_CLIENT`)

---

## API Render — commandes & config

- **Root Directory** : `jamarket-api`
- **Build Command** : `npm install && npx prisma generate && npm run build`
- **Start Command** : `node dist/src/main`  
  (pas `dist/main` — la sortie Nest est `dist/src/` à cause de fichiers TS hors `src`, ex. `prisma/seed.ts`)
- **Pre-Deploy** indisponible sur le plan free → seed / migrate faits **manuellement** depuis le PC
- **Cold start** free : le 1er appel peut prendre 30–50 s

### Variables d’environnement API (Render)

| Variable | Rôle |
|----------|------|
| `DATABASE_URL` | Internal URL Postgres Render |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Obligatoires sinon crash au boot |
| `JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | ex. `15m` / `7d` |
| `CORS_ORIGINS` | URLs Vercel exactes (`https://jamarket-kappa.vercel.app`, etc.) |
| `NODE_ENV` | `production` |
| `SEED_SUPERADMIN_EMAIL` / `SEED_SUPERADMIN_PASSWORD` | Pour le seed |

---

## Problèmes rencontrés & corrections

1. **Plugin Vercel agent** (`npx plugins add vercel/vercel-plugin`)  
   → Non lié au déploiement ; erreur « no agent binary on PATH ». À ignorer.

2. **Build Angular** : `environment.production.ts` missing  
   → Génération via variables d’env + `.gitignore` sur les fichiers générés.

3. **404 Vercel** après build OK  
   → Mauvais Output Directory (manque `/browser`) + manque rewrite SPA → `vercel.json`.

4. **`nest: not found` sur Render**  
   → Avec `NODE_ENV=production`, npm n’installe pas les `devDependencies`.  
   → Déplacés en `dependencies` : `@nestjs/cli`, `typescript`, `prisma`, puis `@types/express`, `@types/multer`, `@types/node`, `ts-node`.

5. **`Cannot find module dist/main`**  
   → Start = `node dist/src/main` (script `start:prod` aligné).

6. **`JwtStrategy requires a secret or key`**  
   → Secrets JWT absents sur Render.

7. **`table public.ad does not exist`**  
   → Migrations non appliquées.  
   → `npx prisma migrate deploy` avec External URL + `?sslmode=require`.

8. **CORS / Angular `status: 0` / Unknown Error**  
   → `CORS_ORIGINS` ne contenait que localhost.  
   → Ajouter les domaines Vercel, redeploy API.

9. **Catalogue vide**  
   → DB sans seed.

10. **Seed local → Render : `P1017 ConnectionClosed`**  
    → SSL manquant vers Postgres cloud.  
    → Pool `pg` avec `ssl: { rejectUnauthorized: false }` si URL `render.com` / `sslmode=require` (dans `seed.ts`, `wipe.ts`, `PrismaService`).

12. **Adblockers (`ERR_BLOCKED_BY_CLIENT` sur `/api/ads/*`)**  
    → Préfixe API renommé en `/api/annonces`. Redéployer API + front.

---

## Seed / reset (état actuel)

Fichiers : `jamarket-api/prisma/seed.ts`, `jamarket-api/prisma/wipe.ts`

### Comportement du seed

- Rôles Admin / Employee / Customer (+ rights)
- Catalogue (types, marques, modèles)
- Super admin **uniquement** via `SEED_SUPERADMIN_EMAIL` + `SEED_SUPERADMIN_PASSWORD` (plus de fallback hardcodé)
- Démo (users + 10 annonces) **activée par défaut** même en prod (`SEED_INCLUDE_DEMO=false` pour désactiver)
- Photos : URLs Unsplash absolues (plus de picsum ; pas de dépendance CDN)
- Idempotent : upserts ; si des annonces existent déjà, remplace les URLs `picsum.photos` restantes

### Scripts npm

```bash
npm run prisma:seed           # seed
npm run prisma:wipe           # vide les tables (TRUNCATE CASCADE)
npm run prisma:reset          # wipe + seed
npm run prisma:migrate:reset  # drop + remigre + seed (souvent OK en local seulement)
npm run prisma:deploy         # migrate deploy + seed (si Pre-Deploy un jour)
```

En `NODE_ENV=production`, le wipe exige `CONFIRM_DB_WIPE=true`.

### Exemple seed / reset Render depuis Windows

```powershell
$env:DATABASE_URL="postgresql://USER:PASS@HOST/jamarket_db?sslmode=require"
$env:SEED_SUPERADMIN_EMAIL="..."
$env:SEED_SUPERADMIN_PASSWORD="..."
$env:CONFIRM_DB_WIPE="true"   # si wipe/reset avec NODE_ENV=production
npm run prisma:reset          # ou : npx prisma db seed
```

---

## Front — images sans CDN

`resolveMediaUrl()` : si l’URL est déjà `http(s)://`, on ne préfixe pas.

Corrigé :

- `catalogue-vehicle-card` (avant : `cdnUrl + url` cassait les URLs Unsplash)
- `ad-image-gallery` (idem)

---

## Features hors déploiement (même période)

- Favoris (API Nest + UI Angular + popup SweetAlert si non connecté)
- Tâches Notion associées marquées **Terminé**

---

## Points d’attention restants

- Uploads locaux sur Render = **éphémères** (pas de R2/S3 encore)
- Free tier DB Render : expiration / sleep possibles
- Plusieurs URLs Vercel → toutes dans `CORS_ORIGINS`
- Branche déployée typiquement `production` / `dev` selon config Git
- Ne jamais committer `.env` (secrets JWT, DB, seed)

---

## Fichiers importants

| Fichier | Rôle |
|---------|------|
| `jamarket/docs/ecart-architecture-deploiement.md` | Justification écart Infomaniak → Vercel/Render |
| `jamarket/docs/handoff-mise-en-prod.md` | Ce document (handoff) |
| `jamarket-client/vercel.json` | Output + SPA rewrites |
| `jamarket-client/scripts/generate-env.mjs` | Env → `environment*.ts` |
| `jamarket-api/prisma/seed.ts` / `wipe.ts` | Seed / reset DB |
| `jamarket-api/src/main.ts` | CORS + Helmet |
| `jamarket-api/src/prisma/prisma.service.ts` | Adapter PG + SSL Render |

---

*Document de travail Jamarket — à coller / reformuler pour un autre chat agent.*
