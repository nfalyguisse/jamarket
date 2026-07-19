# Architecture — Messagerie temps réel (Chat)

## Objectif

Permettre à un **client** de contacter le **vendeur** d’une annonce, et au vendeur de répondre depuis le back-office (`/admin/messages`), en temps réel via WebSocket.

## Modèle de données (Prisma)

- `Conversation` : `adId` + `customerId` + `adminId` (vendeur = `Ad.sellerId`)
  - Contrainte `@@unique([adId, customerId])` : une seule conversation par couple annonce/client
- `Message` : `text`, `conversationId`, `senderId`, `createdAt`

## REST (`/api/conversations`)

| Méthode | Route | Qui | Rôle |
|---------|-------|-----|------|
| `POST` | `/conversations` | Client (JWT) | Crée ou réouvre une conversation (`adminId = sellerId`) |
| `GET` | `/conversations` | Client / Pro / Super-admin | Liste des threads accessibles |
| `GET` | `/conversations/:id` | Participant ou Super-admin | Historique paginé |

Auth : Bearer JWT (`JwtAuthGuard`).

## WebSocket (Socket.IO)

- Namespace : `/chat`
- Auth handshake : `auth.token` (access JWT) ou header `Authorization: Bearer …`
- CORS : mêmes origines que l’API HTTP (`CORS_ORIGINS`)

### Events client → serveur

| Event | Payload | Effet |
|-------|---------|--------|
| `joinConversation` | `{ conversationId }` | Rejoint la room `conversation:{id}` (si participant) |
| `leaveConversation` | `{ conversationId }` | Quitte la room |
| `sendMessage` | `{ conversationId, text }` | Persist + broadcast `newMessage` |
| `typing` | `{ conversationId, isTyping }` | Broadcast `userTyping` (non persisté) |

### Events serveur → client

| Event | Payload |
|-------|---------|
| `newMessage` | Message créé (id, text, sender, conversationId, createdAt) |
| `userTyping` | `{ conversationId, userId, isTyping }` |
| `error` | Erreur d’auth / métier |

## Frontend Angular

- Client : `/messages` et `/messages/:id` — CTA « Contacter le vendeur » sur la fiche annonce
- Admin : `/admin/messages` — inbox leads filtrable par annonce
- Services : `ChatApiService` (HTTP), `ChatSocketService` (Socket.IO, browser-only)
- URL WS dérivée de `environment.cdnUrl` (origine API sans `/api`)

## RGPD

À la suppression de compte client (`DELETE /auth/me`), l’utilisateur est **anonymisé** (`Utilisateur supprimé`). Les conversations/messages restent pour l’historique de l’interlocuteur, sans données personnelles.

## Droits

- Création de conversation : rôle Customer uniquement
- Lecture/écriture : `customerId` ou `adminId` de la conversation
- Super-admin : voit tous les leads (y compris ceux des autres vendeurs)
