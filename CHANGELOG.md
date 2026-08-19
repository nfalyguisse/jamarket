# Changelog

Toutes les versions notables de Jamarket sont documentées ici.
Format des tags Git : `vMAJOR.MINOR.PATCH` (voir [`docs/processus-deploiement.md`](./docs/processus-deploiement.md)).

## [0.3.1] — 2026-08-19

Preuves correctif adblocker + monitoring client Sentry (Bloc 4 — C4.2.2 / C4.3.2). Tag Git : `v0.3.1`.

### Correctif documenté

- **BUG-PROD-001 / ANOM-2026-002** : routes `/api/ads` → `/api/annonces` (contournement des bloqueurs publicitaires — `ERR_BLOCKED_BY_CLIENT`)
- Preuves de reproduction (CAP-BUG-01/02), correctif (CAP-BUG-03/04), CI/CD (CAP-CICD-01/02) et vérification post-déploiement — dossier Bloc 4

### Ajouté

- Intégration Sentry browser (`@sentry/angular`) : interceptor HTTP, `ErrorHandler`, tags `blocked_by_client` / `BUG-PROD-001` / `ANOM-2026-002`
- Filtrage volontaire des `4xx` attendues pour éviter le bruit dans les Issues Sentry
- Documentation limite connue : bloqueurs filtrent aussi `*.ingest.sentry.io` ; solution tunnel documentée

---

## [0.3.0] — 2026-08-10

Release d’observabilité (Bloc 4 — MCO). Tag Git prévu : `v0.3.0` (après smoke prod OK).

### Ajouté

- Supervision Prometheus : `GET /api/metrics` (`prom-client`), gauges santé/runtime, compteurs HTTP et métier (auth, annonces, Cloudinary, chat)
- Chaîne d’exploitation : Grafana Alloy → Prometheus Grafana Cloud → dashboard « Jamarket API » + alerte `jamarket_db_up < 1`
- Documentation : `docs/supervision-alerting.md`, `docs/collecte-anomalies.md`, `docs/grafana-cloud-setup.md`, `docs/bloc4/`

### Sécurité

- Audit runtime API : 9 vulnérabilités *high* ramenées à 0 via reclassement `@nestjs/cli` en `devDependencies` et `overrides` npm (`multer`, `js-yaml`, `lodash`, `brace-expansion`) — montée Nest 11 reportée

### À finaliser (prochaine version)

- Sentry Cloud : DSN / environnement prod à valider (aujourd’hui les événements remontés correspondent surtout au run local, pas à Render)

## [0.2.0] — 2026-07-19

Première mise en production (Vercel + Render). Tag Git : `v0.2.0`.

### Ajouté

- Messagerie temps réel client ↔ vendeur liée à une annonce (REST + WebSocket Socket.IO)
- Conversation unique par couple annonce / client (`adminId` = vendeur de l’annonce)
- UI client `/messages` et CTA « Contacter le vendeur » sur la fiche annonce
- Lead Management back-office `/admin/messages` (filtre par annonce, chat temps réel)
- Documentation `docs/architecture-chat.md`
- Processus de déploiement + checklist smoke tests (`docs/processus-deploiement.md`)

### Sécurité / RGPD

- Auth JWT sur le handshake WebSocket
- Anonymisation « Utilisateur supprimé » à la suppression de compte (conversations conservées pour l’interlocuteur)

### Correctif

- Renommage routes `/api/ads` → `/api/annonces` (bloqueurs publicitaires) — BUG-PROD-001 / `ANOM-2026-002`
