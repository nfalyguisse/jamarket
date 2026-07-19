# Protocole d’intégration continue — Jamarket (C2.1.2)

> Livrable grille : protocole d’intégration continue (chap. 4.2).  
> Outil : **GitHub Actions** — fichier `.github/workflows/ci.yml`.

---

## 1. Objectif

Fusionner régulièrement le code source et **tester automatiquement** les blocs critiques avant intégration sur les branches protégées, afin de réduire les régressions (lint, compilation, tests Vitest).

Dependabot (`.github/dependabot.yml`) complète ce protocole pour les dépendances npm, mais **ne le remplace pas**.

---

## 2. Stratégie de branches

| Branche | Rôle |
|---------|------|
| `feat/*`, `fix/*` | Développement d’une fonctionnalité ou correctif |
| `dev` | Intégration continue des features ; CI obligatoire |
| `main` | Branche de référence stable ; CI obligatoire |
| `production` | Suivi de la prod déployée ; CI obligatoire |

**Séquence de fusion :**

1. Développer sur `feat/<sujet>` à partir de `dev`
2. Ouvrir une **Pull Request** vers `dev` (ou `main` selon le flux)
3. Le workflow **CI** doit être vert (checks GitHub)
4. Merger après revue / auto-validation
5. Déploiement : Vercel (front) et Render (API) se déclenchent sur push des branches liées

---

## 3. Déclencheurs du pipeline

Le workflow `CI` s’exécute sur :

- **push** vers `main`, `dev`, `production`
- **pull_request** ciblant `main`, `dev`, `production`

---

## 4. Séquence d’intégration (jobs)

### Job `api` — cœur du gate qualité

| Étape | Commande / action | But |
|-------|-------------------|-----|
| 1. Checkout | `actions/checkout@v4` | Récupérer le commit |
| 2. Setup Node | Node.js 22 + cache npm | Environnement reproductible |
| 3. Install | `npm ci` (dans `jamarket-api`) | Dépendances figées via lockfile |
| 4. Prisma generate | `npx prisma generate` | Client Prisma pour le build / tests |
| 5. Lint | `npm run lint` | ESLint + Prettier (sans `--fix`) |
| 6. Build | `npm run build` | Compilation NestJS |
| 7. Test Vitest | `npm run test:cov` | Unitaires + rapport de couverture |
| 8. Rapport | artefact `vitest-coverage-api` | Archive `coverage/` (14 jours) |

### Job `client` — non-régression build front

| Étape | Commande / action | But |
|-------|-------------------|-----|
| 1–3. Checkout / Node / Install | idem | Monorepo `jamarket-client` |
| 4. Build | `npm run build` | Build Angular (env CI via `API_URL` / `CDN_URL`) |

Les deux jobs tournent **en parallèle**. Un échec sur l’un ou l’autre fait échouer le check PR.

---

## 5. Périmètre des tests en CI

| Suite | Incluse en CI | Justification |
|-------|---------------|---------------|
| Vitest unitaires (`src/**/*.spec.ts`) | Oui | Pas de BDD requise ; gate rapide |
| Vitest e2e (`npm run test:e2e`) | Non (local / manuel) | Nécessite Postgres `jamarket_test_db` + `.env.test` |
| Karma / Jasmine (client) | Non | Hors stack Vitest du dossier ; build Angular suffit en CI |

---

## 6. Lecture des résultats

1. Onglet **Actions** du dépôt GitHub → workflow **CI**
2. Sur une PR : checks **API (lint · build · Vitest)** et **Client (install · build)**
3. Artefact **vitest-coverage-api** téléchargeable après un run (rapport HTML / LCOV)

Badge (à coller dans un README si besoin) :

```markdown
![CI](https://github.com/nfalyguisse/jamarket/actions/workflows/ci.yml/badge.svg)
```

---

## 7. Reproduction locale (même séquence)

```bash
# API
cd jamarket-api
npm ci
npx prisma generate
npm run lint
npm run build
npm run test:cov

# Client
cd ../jamarket-client
npm ci
API_URL=https://example.com/api CDN_URL=https://example.com npm run build
```

---

## 8. Limites assumées

- Pas de service Postgres dans le workflow (e2e hors CI pour l’instant)
- Pas de déploiement CD dans ce workflow (Vercel / Render gèrent le déploiement)
- Le lint API a été réactivé (`.eslintrc.js`) et doit rester vert pour merger
