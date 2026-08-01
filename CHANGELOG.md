# Changelog

Toutes les versions notables de Jamarket sont documentées ici.
Format des tags Git : `vMAJOR.MINOR.PATCH` (voir [`docs/processus-deploiement.md`](./docs/processus-deploiement.md)).

## [Unreleased]

### Ajouté

- Supervision Prometheus : `GET /api/metrics` (`prom-client`), gauges santé/runtime, compteurs HTTP et métier (auth, annonces, Cloudinary, chat)
- Collecte d’anomalies Sentry (`SENTRY_DSN`) sur 5xx, uploads Cloudinary et erreurs WebSocket inattendues
- Documentation : `docs/supervision-alerting.md`, `docs/collecte-anomalies.md`, `docs/grafana-cloud-setup.md`

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
