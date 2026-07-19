# Sécurité applicative — OWASP Top 10 (Jamarket)

> Preuve pour le dossier de synthèse, **chapitre 2.2** (compétence **C2.2.3** — volet sécurité).  
> Référentiel : [OWASP Top 10:2021](https://owasp.org/Top10/).  
> Date : 2026-07-18 — branche `feat/securite`.

---

## 1. Objectif

Démontrer que Jamarket (API NestJS + Angular SSR) intègre des contre-mesures concrètes face aux 10 risques OWASP les plus critiques, sans se limiter à une checklist théorique.

---

## 2. Tableau de synthèse — OWASP Top 10:2021

| ID | Risque OWASP | Mesures Jamarket | Preuves / emplacements | Statut |
|----|--------------|------------------|------------------------|--------|
| **A01** | Broken Access Control | JWT Bearer sur les routes protégées ; `RightsGuard` + `@RequireRights` (RBAC) ; séparation login client / admin ; comptes soft-deleted / inactifs refusés | `jwt-auth.guard.ts`, `rights.guard.ts`, contrôleurs `ads` / `admin` / `upload` | **Traité** |
| **A02** | Cryptographic Failures | Mots de passe hashés **bcrypt** (jamais en clair) ; secrets JWT / refresh hors code (`.env`) ; `omit: { password: true }` sur les lectures Prisma | `auth.service.ts`, `.env.example` | **Traité** |
| **A03** | Injection | `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`) ; DTOs `class-validator` ; requêtes via **Prisma** (pas de SQL concaténé) | `main.ts`, DTOs `auth/dto/*` | **Traité** |
| **A04** | Insecure Design | Séparation front-office / back-office ; droits granulaires (`CREATE_AD`, `DELETE_AD`, `SUPER_ADMIN`) ; soft-delete plutôt que hard-delete métier | Schéma Prisma + modules Admin / Ads | **Traité** |
| **A05** | Security Misconfiguration | **Helmet** (en-têtes HTTP) ; CORS restreint (`CORS_ORIGINS`) ; Swagger désactivé en production ; CSP assouplie hors prod uniquement pour `/api/docs` | `main.ts` | **Traité** |
| **A06** | Vulnerable and Outdated Components | Dependabot hebdomadaire (API + client) ; script `npm run audit:deps` ; revue manuelle des PR deps. Audit du 2026-07-18 : vulnérabilités modérées/hautes surtout dans la chaîne Nest 10 / Prisma (correctifs = maj majeures). Traitées via Dependabot + plan de montée de version. | `.github/dependabot.yml`, `package.json` → `audit:deps` | **Traité** (suivi actif) |
| **A07** | Identification and Authentication Failures | JWT access court (`15m`) + refresh (`7d`) ; bcrypt ; rate-limit **strict** sur login / register / refresh (5 req/min/IP) ; throttle global 100/min | `auth.controller.ts` (`@Throttle`), `app.module.ts` (`ThrottlerGuard`) | **Traité** |
| **A08** | Software and Data Integrity Failures | Upload images filtré (MIME allow-list JPEG/PNG/WebP/GIF + taille max) ; pas d’exécution de scripts uploadés ; builds CI (lint / build / Vitest) | `multer.config.ts`, `upload.constants.ts` | **Traité** |
| **A09** | Security Logging and Monitoring Failures | `HttpExceptionFilter` : log `warn` (4xx) / `error` (5xx) sans fuite de stack au client ; réponses JSON structurées | `http-exception.filter.ts` | **Partiel** |
| **A10** | Server-Side Request Forgery (SSRF) | Pas d’endpoint « fetch URL » côté API ; côté Angular SSR, hôtes autorisés (`security.allowedHosts`) | `jamarket-client/src/server.ts` | **Traité** (périmètre actuel) |

### Légende des statuts

- **Traité** : contre-mesure en place et démontrable en code.
- **Partiel** : base présente ; supervision avancée (alerting C4.1.2) hors scope de ce chapitre sécurité.

---

## 3. Renforts livrés sur `feat/securite`

| Mesure | Détail |
|--------|--------|
| Helmet | Middleware global avant CORS ; headers `X-Content-Type-Options`, `X-Frame-Options`, HSTS (prod), etc. |
| Rate limiting | `@nestjs/throttler` : garde globale + plafond 5/min sur les endpoints d’authentification |
| Dependabot | PRs hebdomadaires npm pour `jamarket-api` et `jamarket-client` |
| Audit npm | `cd jamarket-api && npm run audit:deps` |

---

## 4. Mesures déjà présentes (rappel)

- Authentification JWT (access + refresh) avec Passport.
- RBAC via `RightsGuard` / `RightEnum`.
- Hash bcrypt des mots de passe.
- Validation stricte des entrées (DTOs + ValidationPipe).
- CORS allow-list.
- Soft-delete + anonymisation RGPD (`DELETE /api/auth/me` — droit à l’oubli).
- Filtrage MIME et limites sur les uploads images.

---

## 5. Limites assumées (jury)

| Sujet | Choix | Piste d’évolution |
|-------|-------|-------------------|
| Stockage du throttler | En mémoire (instance unique) | Redis si scaling horizontal |
| Logging A09 | Filtre HTTP Nest, pas de SIEM | Brancher Sentry / métriques C4.1.2 |
| WAF / reverse-proxy | Hors périmètre appli solo RNCP | Nginx / Cloudflare en prod hébergée |
| CSP production | Défaut Helmet | Affiner si assets CDN externes |

---

## 6. Comment vérifier rapidement

```bash
# Headers Helmet
curl -I http://localhost:3000/api

# Rate-limit auth (attendu : 429 après 5 appels/min)
for i in 1 2 3 4 5 6; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"x@y.z","password":"wrongpass1"}'
done

# Audit dépendances runtime
cd jamarket-api && npm run audit:deps
```

---

_Document à coller / référencer dans le dossier LaTeX — section 2.2 Sécurité (OWASP)._
