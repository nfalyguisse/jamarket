# Processus de déploiement & smoke tests — Jamarket (C2.2.4)

> Déploiement progressif après chaque évolution validée, avec vérification fonctionnelle / technique avant de figer une version (tag Git).

**URLs prod :**

| Composant | URL |
|-----------|-----|
| Front | https://jamarket-kappa.vercel.app |
| API | https://jamarket-api.onrender.com |
| Health | https://jamarket-api.onrender.com/api/health |

Détails techniques (env, commandes, écarts) : [`handoff-mise-en-prod.md`](./handoff-mise-en-prod.md).  
CI avant merge : [`protocole-integration-continue.md`](./protocole-integration-continue.md).

---

## 1. Nomenclature des tags Git

**Format :** `vMAJOR.MINOR.PATCH` (SemVer + préfixe `v`)

| Partie | Quand | Exemple |
|--------|-------|---------|
| **MAJOR** | Breaking change (API, auth, schéma incompatible) | `v1.0.0` → `v2.0.0` |
| **MINOR** | Nouvelle fonctionnalité sans casse | `v0.2.0` → `v0.3.0` |
| **PATCH** | Correctif / hotfix | `v0.2.0` → `v0.2.1` |

**Règles :**

- Un tag = une release **prod** validée (pas chaque commit).
- Tag **annoté** uniquement, aligné sur `CHANGELOG.md`.
- Posé sur le commit déployé (branche `production` / `main` selon le flux).
- Poussé sur le remote : `git push origin vX.Y.Z`.

**Exemple :**

```bash
git tag -a v0.2.0 -m "Release v0.2.0 — première mise en prod"
git push origin v0.2.0
```

---

## 2. Processus de mise en prod (progressif)

```
feat/*  →  PR  →  CI verte  →  merge dev
                ↓
         merge → production (ou main)
                ↓
    deploy auto Vercel (front) + Render (API)
                ↓
    migrations / seed manuels si besoin
                ↓
         smoke tests (checklist §3)
                ↓
    OK → tag vX.Y.Z + entrée CHANGELOG
    KO → rollback (§4) puis correctif
```

### Étapes détaillées

| # | Action | Responsable / outil |
|---|--------|---------------------|
| 1 | Développer sur `feat/<sujet>` depuis `dev` | Dev |
| 2 | Ouvrir une PR vers `dev` ; **CI GitHub Actions** doit être verte | GitHub |
| 3 | Merger la PR, puis merger `dev` → `production` (PR ou merge selon flux) | Dev |
| 4 | Attendre le deploy **Vercel** (front) et **Render** (API) | PaaS |
| 5 | Si schéma DB modifié : `npx prisma migrate deploy` (External URL + `sslmode=require`) | Dev (manuel, plan free) |
| 6 | Exécuter la **checklist smoke** (§3) sur les URLs prod | Dev / utilisateur |
| 7 | Si OK : mettre à jour `CHANGELOG.md`, créer le tag `vX.Y.Z`, le pousser | Dev |
| 8 | Si KO : rollback (§4), ouvrir un correctif `fix/*`, reprendre depuis l’étape 1 | Dev |

### Déploiement progressif — principe

- On ne tague **que** ce qui a passé les smoke tests en prod.
- Les évolutions intermédiaires restent sur `dev` / previews Vercel tant qu’elles ne sont pas mergées en `production`.
- Chaque release taguée est traçable (`git show vX.Y.Z`, GitHub Releases / tags).

---

## 3. Checklist smoke tests (post-déploiement)

À exécuter **après chaque deploy prod**, avant de poser le tag. Durée cible : 5–10 min.  
Cocher / dater une copie (Notion, ce fichier, ou capture) pour la preuve dossier.

**Date :** _______________ **Version / commit :** _______________ **Testeur :** _______________

| # | Parcours | Attendu | OK |
|---|----------|---------|----|
| 1 | Ouvrir le front prod | Page d’accueil charge sans erreur bloquante | ☐ |
| 2 | `GET /api/health` | JSON `status: "ok"`, `services.database: "ok"` (tenir compte du cold start Render ~30–50 s) | ☐ |
| 3 | Catalogue / liste d’annonces | Liste affichée (ou message vide cohérent si DB sans seed) | ☐ |
| 4 | Fiche annonce | Détail + images (ou placeholder si images désactivées) | ☐ |
| 5 | Inscription ou connexion | Session OK ; logout fonctionne | ☐ |
| 6 | Parcours métier clé | Favori **ou** « Contacter le vendeur » / messages selon le périmètre de la release | ☐ |
| 7 | Console navigateur | Pas d’`ERR_BLOCKED_BY_CLIENT` sur les appels API (`/api/annonces`, pas `/api/ads`) | ☐ |

**Résultat global :** ☐ GO (tag + CHANGELOG) ☐ NO-GO (rollback / fix)

### Commande rapide health (PowerShell)

```powershell
Invoke-RestMethod https://jamarket-api.onrender.com/api/health
```

---

## 4. Rollback

| Cible | Action |
|-------|--------|
| Front (Vercel) | Redeploy du déploiement précédent (Dashboard → Deployments → Promote) ou revert Git + push sur la branche liée |
| API (Render) | Redeploy du commit / tag précédent depuis le Dashboard Render |
| DB | Ne pas rollback une migration appliquée sans plan ; préférer une migration corrective (`fix`) |

Après rollback : rejouer la checklist smoke, puis tag PATCH si une version corrigée est re-publiée.

---

## 5. Traçabilité des versions

| Artefact | Rôle |
|----------|------|
| Git (branches + historique) | Gestion de versions |
| Tags `vX.Y.Z` | Points de release prod figés |
| `CHANGELOG.md` | Historique synthétique des évolutions |
| Cette checklist (datée) | Preuve que le logiciel est fonctionnel et utilisable en autonomie |

---

*Document Jamarket — compétence C2.2.4 (déploiement progressif + vérification).*
