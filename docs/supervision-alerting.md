# Supervision et alerting (C4.1.2)

Document de référence pour la supervision Jamarket API : indicateurs Prometheus, endpoint health, Grafana Cloud et alertes.

## Architecture

```
Angular (Vercel) ──► NestJS API (Render)
                         │
                         ├── GET /api/health     → probe disponibilité + DB
                         └── GET /api/metrics    → scrape Prometheus / Grafana Cloud
                                                    │
                                                    ▼
                                              Grafana Cloud
                                              (dashboard + alertes email)
```

- **Métriques** : `prom-client` dans `jamarket-api/src/metrics/`
- **Visualisation / alerting** : Grafana Cloud (free tier)
- **Anomalies détaillées** : Sentry (voir [`collecte-anomalies.md`](./collecte-anomalies.md)) — C4.2.1

## Endpoints

| URL | Rôle |
| --- | --- |
| `https://jamarket-api.onrender.com/api/health` | Santé JSON (`status`, `services.database`, `uptime`) |
| `https://jamarket-api.onrender.com/api/metrics` | Exposition Prometheus (texte) |

Local : `http://localhost:3000/api/health` et `http://localhost:3000/api/metrics`.

Les routes `/api/health` et `/api/metrics` sont **exclues** des histogrammes HTTP (évite le bruit de scrape).

## Catalogue des métriques

### Santé & runtime

| Métrique | Type | Signification |
| --- | --- | --- |
| `jamarket_up` | gauge | Process API vivant (=1) |
| `jamarket_db_up` | gauge | Ping Prisma OK (=1) / KO (=0) — aligné sur `/api/health` |
| `jamarket_process_uptime_seconds` | gauge | Uptime Node (cold start / redémarrages Render) |
| `jamarket_nodejs_heap_used_bytes` | gauge | Heap utilisé |

### Trafic HTTP (intercepteur global)

| Métrique | Labels | Signification |
| --- | --- | --- |
| `jamarket_http_requests_total` | `method`, `route`, `status_code` | Volume + répartition des codes |
| `jamarket_http_request_duration_seconds` | `method`, `route` | Latence (histogramme) |

La `route` est le path Nest normalisé (`/api/annonces/:id`), jamais l’URL avec ID.

Indicateurs dérivés Grafana (pas de métrique dédiée) :

- **Taux 5xx** = `sum(rate(jamarket_http_requests_total{status_code=~"5.."}[5m])) / sum(rate(jamarket_http_requests_total[5m]))`
- Taux 4xx : diagnostic uniquement (pas d’alerte — bruit login)

### Compteurs métier

| Métrique | Labels | Déclencheur |
| --- | --- | --- |
| `jamarket_auth_failures_total` | `flow` = `login` \| `admin_login` \| `register` | 401 / 409 / 403 sur ces flux |
| `jamarket_ads_mutations_total` | `action` = `create` \| `update` \| `sold`, `result` | Mutations annonces |
| `jamarket_cloudinary_uploads_total` | `result` = `success` \| `error` | Upload image véhicule |
| `jamarket_chat_conversations_total` | `result` | `POST /conversations` |
| `jamarket_ws_connections_total` | `result` | Handshake WebSocket `/chat` |

## Alertes recommandées (Grafana)

| Alerte | Condition | Action |
| --- | --- | --- |
| API / DB dégradée | `jamarket_db_up == 0` pendant > 2 min | Vérifier Render Postgres + logs API |
| Pic d’erreurs serveur | taux 5xx > 5 % sur 5 min | Consulter Sentry + logs Render |
| Échecs médias | `rate(jamarket_cloudinary_uploads_total{result="error"}[10m]) > 0` soutenu | Vérifier clés Cloudinary / quotas |

Probe complémentaire : **Synthetic Monitoring** Grafana (ou UptimeRobot) sur `GET /api/health` — alerte si timeout ou corps JSON `status != "ok"` (couvre aussi le cold start Render).

## Brancher Grafana Cloud (preuve C4.1.2)

Étape manuelle (compte gratuit) :

1. Créer un stack Grafana Cloud : <https://grafana.com/products/cloud/>
2. Dans **Connections → Add new connection → Hosted Prometheus metrics**, créer un token de scrape / remote write selon le mode choisi
3. Mode simple pour Jamarket (API publique Render) :
   - **Metrics Endpoint** / Blackbox-style scrape HTTP de `https://jamarket-api.onrender.com/api/metrics`
   - Intervalle : **60 s** (tenir compte du cold start free tier)
4. Créer un dashboard « Jamarket API » avec panels :
   - `jamarket_up` / `jamarket_db_up`
   - `jamarket_process_uptime_seconds`
   - rate HTTP + taux 5xx
   - `jamarket_cloudinary_uploads_total`
5. Créer au moins **une règle d’alerte** (ex. `jamarket_db_up == 0`) avec contact point **email**
6. Déclencher un test (arrêt temporaire DB locale, ou attendre un cold start) et **capturer** :
   - dashboard Grafana
   - notification d’alerte reçue

Fichier d’aide : [`grafana-cloud-setup.md`](./grafana-cloud-setup.md) (checklist + requêtes PromQL).

## Variables d’environnement

Aucune variable obligatoire pour Prometheus (endpoint ouvert).  
Pour Sentry (erreurs) : `SENTRY_DSN` — voir `.env.example`.

## Preuves dossier RNCP

- Capture `GET /api/metrics` (extrait texte)
- Capture dashboard Grafana
- Capture alerte email / historique Grafana Alerting
- Lien vers ce document + [`collecte-anomalies.md`](./collecte-anomalies.md)
