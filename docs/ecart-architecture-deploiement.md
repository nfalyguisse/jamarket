# Note d’écart — Architecture de déploiement Jamarket

> **Public cible** : agent / rédacteur du dossier RNCP (bloc architecture & déploiement).  
> **Objectif** : justifier l’écart entre le déploiement prévu (bloc 1) et le déploiement réalisé, sans réécrire toute l’architecture applicative.

---

## 1. Architecture prévue (bloc 1)

| Composant | Cible initiale |
|-----------|----------------|
| Front Angular (`jamarket-client`) | Conteneur Docker sur **VPS Infomaniak** |
| API NestJS (`jamarket-api`) | Conteneur Docker sur le **même VPS Infomaniak** |
| Base PostgreSQL | Conteneur / service sur le VPS |
| Orchestration | Docker (éventuellement Compose) |

**Intention** : stack unifiée, maîtrise de l’infra, proximité avec une mise en production « classique » (VPS + conteneurs).

---

## 2. Architecture réalisée (contrainte budgétaire)

| Composant | Cible réelle | Motif |
|-----------|--------------|--------|
| Front Angular | **Vercel** (build static / CSR, repo Git lié, root `jamarket-client`) | Gratuit / économique, CDN, CI/CD Git |
| API NestJS | Hébergeur **free / freemium** type **Render** ou **Fly.io** (Node long-running + Postgres) | Pas de coût VPS mensuel Infomaniak |
| Base PostgreSQL | Postgres managé free (ex. Render Postgres, **Neon**, Supabase) | Découplé du VPS |
| Médias (uploads) | **Cloudinary** (CDN + WebP) — local et prod | Disque Render éphémère ; free tier adapté RNCP |

**Front déjà en place** : projet Vercel relié au dépôt Git, variables d’environnement `API_URL` / `CDN_URL` injectées au build (`scripts/generate-env.mjs`).

---

## 3. Justification de l’écart

1. **Budget** — Le VPS Infomaniak (et la charge opérationnelle associée) n’était plus compatible avec le contexte économique du projet étudiant / MVP RNCP.
2. **Séparation front / API** — Le front est principalement une SPA Angular servie en statique : Vercel est adapté (CDN, HTTPS, déploiements automatiques). L’API Nest + Prisma + Postgres reste un **service Node persistant**, mieux servi par Render/Fly que par des serverless « purs ».
3. **Continuité fonctionnelle** — Même découpage applicatif (client / API / DB). Seul le **lieu d’hébergement** et le **modèle économique** changent.
4. **Traçabilité dossier** — L’écart est **assumé et documenté** : architecture cible (Infomaniak + Docker) vs architecture effective (Vercel + PaaS free), avec les limites connues (cold start, stockage uploads).

---

## 4. Ce qui ne change pas (à rappeler dans le dossier)

- Monorepo : `jamarket-client` (Angular) + `jamarket-api` (NestJS + Prisma).
- Contrat API REST (`/api/...`), JWT, CORS configurable via `CORS_ORIGINS`.
- Schéma PostgreSQL / migrations Prisma.
- Capacité à **revenir** à un VPS Docker (Infomaniak ou autre) sans refonte métier : l’API reste une app Node standard (`npm run build` → `node dist/main`).

---

## 5. Limites à mentionner (honnêteté technique)

| Limite | Impact | Mitigation / discours |
|--------|--------|------------------------|
| Sleep / cold start (free tier API) | 1er appel lent après inactivité | Acceptable en démo RNCP ; upgrade possible en prod |
| Disque non persistant (uploads historiques) | Anciennes images locales perdues au redeploy | **Mitigé** : Cloudinary + `CDN_URL` ; re-upload si URLs `/api/uploads/...` restantes |
| Deux fournisseurs (Vercel + Render/Fly) | CORS + env à synchroniser | `CORS_ORIGINS` = URL Vercel ; `API_URL` côté client |
| Écart vs plan Infomaniak | Non conformité stricte au plan initial | Justifié par contrainte budgétaire, réversible |

---

## 6. Formulation type pour le dossier (à adapter)

> L’architecture de déploiement initialement retenue prévoyait un **VPS Infomaniak** hébergeant les conteneurs Docker du client Angular et de l’API NestJS. Pour des **raisons budgétaires**, le front a été déployé sur **Vercel** (hébergement statique adapté à une SPA) et l’API sur un **PaaS gratuit** (ex. Render / Fly.io) avec PostgreSQL managé. Cette évolution **ne modifie pas** l’architecture logicielle (séparation client/API, PostgreSQL, JWT) ; elle constitue un **écart d’infrastructure** documenté, réversible vers une cible VPS/Docker si le budget le permet.

---

## 7. Points à brancher côté rédaction (checklist agent)

- [ ] Schéma « prévu » vs schéma « réalisé » (2 diagrammes ou 1 avec légende d’écart)
- [ ] Tableau des services (Vercel, PaaS API, Postgres, Cloudinary)
- [ ] Variables d’environnement critiques (`API_URL`, `CDN_URL`, `DATABASE_URL`, `CORS_ORIGINS`, JWT, `CLOUDINARY_*`)
- [ ] Lien avec les compétences déploiement / DevOps du référentiel (choix d’hébergement, CI/CD Git)
- [ ] Phrase d’ouverture sur la **contrainte budgétaire** + phrase de **réversibilité** Docker/VPS

---

*Document de travail Jamarket — à intégrer / reformuler dans le rapport RNCP, pas un livrable client.*
