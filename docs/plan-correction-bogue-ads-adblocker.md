# Plan de correction de bogue — Blocage client des routes `/api/ads`

> Document source pour le dossier de synthèse (compétence **C2.3.2**).  
> Contexte : mise en production Jamarket (front Vercel + API Render), recette sur environnement de production.

| Champ | Valeur |
|-------|--------|
| **Identifiant** | BUG-PROD-001 |
| **Date de détection** | 2026-07-19 |
| **Environnement** | Production (`https://jamarket-kappa.vercel.app` → `https://jamarket-api.onrender.com`) |
| **Sévérité** | **Bloquant** (parcours métier principaux inutilisables selon le navigateur / extensions) |
| **Statut** | Corrigé (refactor des URLs API) |
| **Compétence** | C2.3.2 — Plan de correction des bogues |

---

## 1. Processus de traitement des anomalies

Pour chaque anomalie détectée en développement ou en recette, je suis le cycle suivant :

1. **Détection** — observation utilisateur, cahier de recettes, ou console navigateur (Network / Console).
2. **Qualification** — sévérité (bloquant / majeur / mineur / cosmétique), périmètre impacté, reproductibilité.
3. **Analyse** — hypothese(s), confrontation aux preuves (logs HTTP, CORS, SSR, extensions…).
4. **Correction** — patch minimal, cohérent API + client.
5. **Vérification** — retest du scénario en échec + contrôle d’absence de régression sur les parcours proches.
6. **Clôture** — documentation (issue / ce plan), déploiement, mise à jour CHANGELOG si besoin.

---

## 2. Description du bogue

### 2.1 Symptômes observés

Lors de la recette en production :

- La **fiche détail** d’une annonce (`/annonces/:id`) affichait « Annonce introuvable ».
- Le **listing admin** « Mes annonces » affichait « Service indisponible pour le moment ».
- En revanche, le **catalogue**, la **connexion**, l’**inscription** et les **favoris** fonctionnaient sur le même environnement.

### 2.2 Preuves techniques (console navigateur)

```text
GET https://jamarket-api.onrender.com/api/ads/10
net::ERR_BLOCKED_BY_CLIENT

GET https://jamarket-api.onrender.com/api/ads/mine?scope=mine
net::ERR_BLOCKED_BY_CLIENT
```

Côté Angular, l’erreur remontée était un `HttpErrorResponse` avec `status: 0` et `statusText: "Unknown Error"` — symptôme trompeur, souvent associé à tort à un problème CORS ou réseau serveur.

### 2.3 Conditions de reproduction

| Condition | Résultat |
|-----------|----------|
| Navigateur avec bloqueur de publicités / filtre agressif | Échec sur les appels contenant `/ads/` |
| Autre navigateur (ou bloqueur désactivé) | Détail et listing admin OK |
| Navigation privée *avec* extensions autorisées | Peut encore échouer |

---

## 3. Analyse

### 3.1 Hypothèses écartées

| Hypothèse | Pourquoi écartée |
|-----------|------------------|
| **SSR Angular** | Front déployé en **CSR** sur Vercel ; l’erreur est un blocage navigateur (`ERR_BLOCKED_BY_CLIENT`), pas un échec d’hydratation. |
| **CORS** | Les prévols OPTIONS et les réponses API pour l’origine Vercel étaient corrects ; un vrai refus CORS aurait produit un message *CORS policy*, pas `Blocked by client`. |
| **API Render down / cold start** | Les autres endpoints (`/auth`, catalogue via chemins non filtrés, etc.) répondaient ; un appel direct à `GET /api/ads/:id` hors navigateur filtré renvoyait 200. |
| **Données absentes** | Le message « Annonce introuvable » était un fallback UI côté front après échec HTTP `status: 0`, pas une 404 métier. |

### 3.2 Cause racine retenue

Les **bloqueurs de publicités** (uBlock, AdGuard, filtres Brave, etc.) interceptent fréquemment les requêtes dont l’URL contient le segment **`/ads/`**, assimilé à de la publicité.

Conséquence :

- le navigateur **n’envoie pas** (ou annule) la requête vers l’API ;
- Angular reçoit `status: 0` ;
- l’UI affiche une erreur générique ou « introuvable ».

Impact métier : tout parcours reposant sur le préfixe REST `/api/ads` (détail public, CRUD / listing back-office, pending dashboard) était **fragile en conditions réelles utilisateur**, alors que la stack serveur était saine.

### 3.3 Point d’amélioration (au-delà du correctif)

- Ne pas nommer des ressources métier avec des mots-clés filtrés par les adblockers (`ads`, `advert`, `banner`, `tracking`…).
- Lors d’un `status: 0`, vérifier systématiquement Network pour `ERR_BLOCKED_BY_CLIENT` avant de suspecter CORS/SSR.
- Prévoir une recette multi-navigateurs (avec et sans extensions).

---

## 4. Plan de correction

| Étape | Action | Responsable | Résultat attendu |
|-------|--------|-------------|------------------|
| 1 | Confirmer la cause (test navigateur sans bloqueur vs avec) | Développeur | Symptôme disparaît sans bloqueur |
| 2 | Renommer le préfixe HTTP NestJS `@Controller('ads')` → `@Controller('annonces')` | API | Routes exposées sous `/api/annonces` |
| 3 | Mettre à jour tous les clients HTTP Angular (détail, home, catalogue, admin) | Front | Plus aucun appel vers `/api/ads` |
| 4 | Aligner les tests e2e Vitest API | Qualité | Suite verte sur les nouveaux chemins |
| 5 | Documenter (handoff / dossier) | Doc | Traçabilité C2.3.2 |
| 6 | Redéployer **API puis front** | Ops | Prod cohérente (éviter 404 transitoires) |
| 7 | Retester fiche + listing admin *avec* bloqueur actif | Recette | Parcours OK |

### 4.1 Correctif appliqué (code)

- **API** : `jamarket-api/src/ads/ads.controller.ts` — `@Controller('annonces')`.
- **Front** : services `ad-detail-api`, `home-api`, `catalogue-api`, `admin-ads-api` — base URL `${apiUrl}/annonces`.
- **Tests** : `jamarket-api/test/vital-paths.e2e-spec.ts`.

Les dossiers internes (`src/ads/`, features Angular `features/ads`) n’ont **pas** été renommés : seul le **chemin HTTP** compte pour les filtres navigateur.

### 4.2 Nouveaux endpoints (exemples)

| Avant (bloqué) | Après |
|----------------|-------|
| `GET /api/ads` | `GET /api/annonces` |
| `GET /api/ads/:id` | `GET /api/annonces/:id` |
| `GET /api/ads/mine` | `GET /api/annonces/mine` |
| `GET /api/ads/pending` | `GET /api/annonces/pending` |

---

## 5. Vérification et clôture

### 5.1 Critères d’acceptation

- [x] `GET /api/annonces/:id` accessible depuis le front Vercel avec bloqueur actif.
- [x] Listing admin « Mes annonces » charge sans `ERR_BLOCKED_BY_CLIENT`.
- [x] Catalogue / auth / favoris toujours OK (pas de régression).
- [x] Tests e2e API mis à jour sur `/annonces`.

### 5.2 Bilan

| Élément | Décision |
|---------|----------|
| BUG-PROD-001 | **Corrigé** — refactor URLs |
| Contournement utilisateur (désactiver adblocker) | **Reporté / non retenu** comme solution — inacceptable en production grand public |
| Renommage des dossiers source `ads` | **Reporté** — cosmétique, hors cause racine |

---

## 6. Synthèse pour le jury (C2.3.2)

Ce cas illustre une anomalie **détectée en recette production**, **qualifiée bloquante**, **analysée** (élimination SSR/CORS, identification adblocker), **corrigée** par un changement d’API contractuel, puis **vérifiée**. Il montre aussi qu’un `HttpErrorResponse` à `status: 0` ne doit pas être interprété mécaniquement comme un défaut d’infrastructure cloud : la preuve Network (`ERR_BLOCKED_BY_CLIENT`) oriente vers le client.
