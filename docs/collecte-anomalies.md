# Collecte des anomalies (C4.2.1)

Processus de journalisation et de collecte des anomalies runtime Jamarket API.

## Objectif

Compléter la supervision Prometheus / Grafana (indicateurs) par une **collecte d’erreurs** exploitable : stack, contexte HTTP, tags métier, puis registre de suivi.

## Canaux

| Canal | Outil | Quand |
| --- | --- | --- |
| Logs applicatifs | Nest `Logger` (stdout Render) | 4xx (warn) et 5xx (error) via `HttpExceptionFilter` |
| Issues centralisées | **Sentry** (`@sentry/node`) | status ≥ 500, échecs Cloudinary, erreurs WS inattendues |
| Indicateurs | Prometheus `/api/metrics` | volumes, taux d’erreur, DB down |

Les **4xx** (login échoué, validation) ne créent **pas** d’issue Sentry (bruit). Ils restent dans les logs + compteurs `jamarket_auth_failures_total` / HTTP.

## Initialisation

Dans `main.ts` : `initSentry()` lit `SENTRY_DSN`.

- Absent / vide → no-op (dev local sans compte)
- Présent → `tracesSampleRate: 0` (error-tracking uniquement, pas de tracing distribué V1)

Variable Render : `SENTRY_DSN` (Settings → Environment).

## Points de capture

| Emplacement | Condition | Tags |
| --- | --- | --- |
| `HttpExceptionFilter` | `statusCode >= 500` | `method`, `path`, `statusCode` |
| `CloudinaryService.uploadBuffer` / `destroy` | échec SDK | `feature=upload`, `provider=cloudinary` |
| `ChatGateway.handleConnection` | erreur **inattendue** (hors token/JWT manquant) | `feature=chat`, `transport=websocket` |
| `ChatGateway.handleSendMessage` | exception non métier | `feature=chat`, `event=message` |

Fichier utilitaire : `jamarket-api/src/common/sentry.ts`.

## Processus de collecte (registre)

1. **Détection** — Sentry Issue et/ou log Render `error` et/ou alerte Grafana (5xx / `db_up`)
2. **Qualification** — ouvrir l’Issue Sentry : stack, route, environnement (`production`)
3. **Enregistrement** — ajouter une entrée au registre (Notion « Anomalies » ou tableau ci-dessous)
4. **Traitement** — branche `fix/…` → CI GitHub Actions → merge → deploy Render/Vercel
5. **Clôture** — résoudre l’Issue Sentry + entrée [`CHANGELOG.md`](../CHANGELOG.md)

### Modèle d’entrée registre

| Champ | Exemple |
| --- | --- |
| ID | `ANOM-2026-001` |
| Date | 2026-07-22 |
| Source | Sentry / Grafana / logs Render |
| Symptôme | `POST /api/vehicules/:id/images` → 500 |
| Impact | Upload images stock bloqué |
| Cause | Clé Cloudinary invalide / timeout |
| Correctif | PR #… / tag `v0.x.y` |
| Statut | Ouvert / En cours / Clos |

### Registre local (démarrage)

| ID | Date | Source | Symptôme | Statut |
| --- | --- | --- | --- | --- |
| — | — | — | À renseigner après première Issue Sentry ou alerte Grafana | — |

## Vérification rapide

1. Configurer `SENTRY_DSN` (projet Sentry free)
2. Déclencher une 500 de test (ex. endpoint temporaire ou forcer une erreur Cloudinary en staging)
3. Vérifier l’apparition de l’Issue dans Sentry (< 1 min)
4. Copier le lien Issue + screenshot dans le dossier RNCP
5. Créer l’entrée registre puis documenter le correctif dans le CHANGELOG

## Lien avec C4.1.2

- Grafana signale **qu’**il y a un problème (taux 5xx, DB down)
- Sentry explique **quoi** (stack, feature)
- Le registre prouve le **processus** de collecte et de suivi
