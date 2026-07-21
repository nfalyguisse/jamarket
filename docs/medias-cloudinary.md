# Feature médias — Stockage d’images Cloudinary

> **Public cible** : agent / rédacteur du dossier RNCP (architecture, déploiement, éco-conception, sécurité).  
> **Objectif** : documenter le choix, le fonctionnement et les preuves techniques du stockage des images véhicules / avatars, sans devoir relire tout le code.

**Documents liés** : [`ecart-architecture-deploiement.md`](./ecart-architecture-deploiement.md), [`handoff-mise-en-prod.md`](./handoff-mise-en-prod.md), [`securite-owasp.md`](./securite-owasp.md).

---

## 1. Contexte & problème

| Élément | Détail |
|---------|--------|
| Front | Angular sur **Vercel** (`jamarket-client`) |
| API + BDD | NestJS + PostgreSQL sur **Render** (`jamarket-api`) |
| Problème initial | Images écrites sur le **disque local** de l’API (`uploads/`) |
| Impact prod | Disque Render **éphémère** : fichiers perdus à chaque redeploy / sleep, alors que les URLs restent en BDD |
| Impact démo RNCP | Galeries véhicules / avatars cassés en production |

**Solution retenue** : hébergement des médias sur **Cloudinary** (CDN + free tier), avec conversion **WebP** à l’upload.

---

## 2. Choix technique (à reformuler pour le dossier)

### Pourquoi Cloudinary

- Free tier adapté à une soutenance / MVP étudiant (pas de budget VPS stockage).
- CDN HTTPS : le navigateur charge l’image hors Render → allège l’API et survit aux redeploys.
- Transformations natives : `format: 'webp'`, `quality: 'auto'` → **éco-conception** (poids réduit, lazy loading côté UI déjà en place sur les galeries).
- SDK Node (`cloudinary`) simple avec Multer déjà en `memoryStorage()` (buffer → `upload_stream`).

### Alternative écartée (mais citée dans l’écart d’archi)

- **Cloudflare R2** (object storage S3-compatible) : plus « pur » object storage, mais plus de config + pas de conversion WebP native.
- Disque persistant Render : payant, hors contrainte budgétaire.

### Parité local / production

**Un seul chemin** : pas de branche « disque en local / Cloudinary en prod ».  
Les mêmes variables `CLOUDINARY_*` sont utilisées en développement et sur Render, pour valider upload + affichage + suppression **avant** de pousser.

---

## 3. Architecture du flux

```
Admin Angular (FormData)
        │
        ▼
NestJS API  ── Multer (mémoire) ──► Cloudinary CDN (WebP)
        │                                  │
        │                                  ▼
        └──── Prisma Image.url / User.avatarUrl
                    = https://res.cloudinary.com/...
        │
        ▼
Front (Vercel / localhost) ── resolveMediaUrl() ──► affichage CDN
```

### Rôles des composants

| Couche | Rôle |
|--------|------|
| Front | Envoie le fichier ; affiche l’URL HTTPS renvoyée (aucune clé secrète Cloudinary côté client) |
| API Nest | Auth / droits, validation MIME & taille, upload & destroy Cloudinary, persistance URL en BDD |
| Cloudinary | Stockage + CDN + conversion WebP |
| PostgreSQL | Métadonnées uniquement (`Image.url`, `User.avatarUrl`) — **pas** le binaire |

### Organisation des dossiers Cloudinary

| Type | Dossier |
|------|---------|
| Photos véhicule | `jamarket/vehicules/{vehiculeId}/{uuid}` |
| Avatar admin | `jamarket/users/{userId}/{uuid}` |

---

## 4. Modèle de données

### Prisma `Image`

- `id`, `url` (string), `vehiculeId`
- `url` = URL **absolue** Cloudinary après migration de la feature
- Les anciennes URLs relatives `/api/uploads/...` (stockage disque) peuvent encore exister en BDD : fichiers associés **perdus** → re-upload ou re-seed nécessaire

### Seed démo

- Photos de démo : URLs **Unsplash** absolues (indépendantes de Cloudinary)
- Compatible avec `resolveMediaUrl()` (passe les `https://` tels quels)

---

## 5. Implémentation — fichiers clés

| Fichier | Rôle |
|---------|------|
| `jamarket-api/src/upload/cloudinary.service.ts` | Config SDK, `uploadBuffer`, `destroy`, extraction `public_id` depuis l’URL |
| `jamarket-api/src/upload/image-processing.service.ts` | Orchestration upload véhicule / avatar → Cloudinary |
| `jamarket-api/src/upload/upload.service.ts` | Métier : limites, CRUD Prisma `Image`, suppression Cloudinary |
| `jamarket-api/src/upload/multer.config.ts` | `memoryStorage()`, MIME allow-list, taille max 5 Mo, max 10 fichiers |
| `jamarket-api/src/upload/upload.controller.ts` | `POST/DELETE /api/vehicules/:id/images` |
| `jamarket-api/src/auth/auth.service.ts` | Avatar admin (même pipeline Cloudinary) |
| `jamarket-api/src/main.ts` | **Plus** de `useStaticAssets` pour `/uploads` (médias hors Nest) |
| `jamarket-client/src/core/utils/media-url.util.ts` | `resolveMediaUrl()` ; `DISABLE_REMOTE_MEDIA = false` |
| `jamarket-api/.env.example` | Documentation des variables `CLOUDINARY_*` |

### Comportement upload (API)

1. Réception multipart → buffer Multer.
2. Upload vers Cloudinary (`format: 'webp'`, `quality: 'auto'`).
3. Persistance de `secure_url` en BDD.
4. Réponse JSON au front avec les images liées.

### Comportement suppression

1. Lecture de `Image.url` (ou `avatarUrl`).
2. Extraction du `public_id` Cloudinary depuis l’URL.
3. `cloudinary.uploader.destroy(publicId)`.
4. Suppression de la ligne Prisma.

### Comportement affichage (front)

- URL `https://...` (Cloudinary / Unsplash) → utilisée telle quelle.
- URL relative historique `/api/...` → préfixée par l’origine API (fichiers souvent absents en prod).
- Preview admin pendant sélection : `blob:` / `data:` laissés intacts.

---

## 6. Variables d’environnement

Obligatoires pour démarrer l’API (échec au boot si absentes) :

| Variable | Où | Rôle |
|----------|-----|------|
| `CLOUDINARY_CLOUD_NAME` | `.env` local + Render | Identifiant du cloud |
| `CLOUDINARY_API_KEY` | `.env` local + Render | Clé API |
| `CLOUDINARY_API_SECRET` | `.env` local + Render | Secret (jamais côté front / jamais committer) |

Côté Vercel (doc / cohérence) :

| Variable | Exemple |
|----------|---------|
| `CDN_URL` | `https://res.cloudinary.com/<CLOUDINARY_CLOUD_NAME>` |
| `API_URL` | `https://jamarket-api.onrender.com/api` |

`resolveMediaUrl` n’a **pas besoin** de `CDN_URL` si les URLs stockées sont déjà absolues.

---

## 7. Sécurité (lien OWASP / dossier)

| Mesure | Détail |
|--------|--------|
| Auth / RBAC | Upload & delete images protégés (JWT + droits admin / vendeur selon routes) |
| MIME allow-list | JPEG, PNG, WebP, GIF uniquement |
| Taille max | 5 Mo / fichier ; max 10 images / véhicule |
| Secrets | API Secret uniquement serveur ; pas d’upload unsigned depuis le navigateur |
| Intégrité | Pas d’exécution de scripts uploadés ; binaire hors process Node après upload |

Réf. tableau OWASP : [`securite-owasp.md`](./securite-owasp.md) (A01, A08).

---

## 8. Éco-conception & perf (arguments dossier)

- Compression / conversion **WebP** côté Cloudinary à l’upload.
- Qualité `auto` (adaptation Cloudinary).
- Diffusion via **CDN** (latence, cache géo).
- API Nest allégée : ne sert plus les fichiers statiques médias.
- Front : lazy loading / placeholders déjà présents sur les composants galerie / cards (à croiser avec le code UI dans le dossier).

---

## 9. Déploiement & ops (checklist)

1. Compte Cloudinary free → récupérer Cloud name / API Key / API Secret.
2. Renseigner `CLOUDINARY_*` dans `jamarket-api/.env` → tester **en local** (upload, affichage fiche, suppression).
3. Ajouter les **mêmes** variables sur le service API **Render**.
4. Redéployer API (+ front si besoin pour `DISABLE_REMOTE_MEDIA` / build).
5. Re-uploader les images métier si d’anciennes URLs `/api/uploads/...` restent en BDD.
6. Optionnel Vercel : `CDN_URL` = origine Cloudinary.

### Limites assumées (honnêteté technique)

| Limite | Discours dossier |
|--------|------------------|
| Free tier Cloudinary | Suffisant démo RNCP ; quotas à surveiller |
| Pas de migration auto des anciennes images disque | Perdues avec le disque Render ; re-upload |
| Dépendance tierce | Choix assumé vs disque éphémère PaaS free ; réversible (R2/S3) |

---

## 10. Formulation type pour le dossier (à adapter)

> Les images véhicules et avatars étaient initialement stockées sur le **système de fichiers** de l’API NestJS. Sur l’hébergeur free **Render**, ce disque est **non persistant** : les fichiers disparaissaient au redeploy alors que les références restaient en base. Pour garantir la disponibilité des médias en production (front **Vercel**, API **Render**) dans un contexte **budgétaire contraint**, le stockage a été externalisé vers **Cloudinary** (CDN, free tier). L’API reçoit les fichiers en mémoire (Multer), les envoie à Cloudinary avec conversion **WebP**, et ne persiste en PostgreSQL que l’URL HTTPS. Le même mécanisme est utilisé en **développement local** et en production, afin de valider le parcours avant déploiement. Ce choix contribue à l’**éco-conception** (format WebP, diffusion CDN) et à la **séparation des responsabilités** (API métier vs stockage média).

---

## 11. Compétences / angles rédactionnels suggérés

À croiser avec [`competencies.md`](./competencies.md) selon le plan du dossier :

| Angle | Contenu exploitable |
|-------|---------------------|
| Architecture / déploiement | Écart disque local → Cloudinary ; schéma Vercel + Render + Cloudinary |
| Sécurité | Filtrage MIME, secrets serveur, OWASP A08 |
| Éco-conception / perf | WebP, CDN, allègement API |
| Traçabilité / doc technique | Ce document + handoff mise en prod |
| Scalabilité | Médias découplés du process Node / disque PaaS |

---

## 12. Preuves / captures suggérées pour le dossier

- [ ] Dashboard Cloudinary : dossier `jamarket/vehicules/...` avec une image uploadée
- [ ] Ligne BDD `Image.url` commençant par `https://res.cloudinary.com/`
- [ ] Fiche annonce front (Vercel) affichant la photo
- [ ] Variables Render (noms uniquement, **pas** les secrets en clair dans le rapport)
- [ ] Extrait code : `cloudinary.service.ts` (upload WebP) + `resolveMediaUrl`

---

*Document de travail Jamarket — handoff rédaction dossier RNCP, pas un livrable client final.*
