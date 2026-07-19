# Changelog

## [0.2.0] — 2026-07-19

### Ajouté

- Messagerie temps réel client ↔ vendeur liée à une annonce (REST + WebSocket Socket.IO)
- Conversation unique par couple annonce / client (`adminId` = vendeur de l’annonce)
- UI client `/messages` et CTA « Contacter le vendeur » sur la fiche annonce
- Lead Management back-office `/admin/messages` (filtre par annonce, chat temps réel)
- Documentation `docs/architecture-chat.md`

### Sécurité / RGPD

- Auth JWT sur le handshake WebSocket
- Anonymisation « Utilisateur supprimé » à la suppression de compte (conversations conservées pour l’interlocuteur)
