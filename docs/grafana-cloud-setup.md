# Checklist Grafana Cloud — Jamarket

Guide pas-à-pas pour brancher le scrape `/api/metrics` et poser les alertes (preuve C4.1.2).

## Prérequis

- API déployée : `https://jamarket-api.onrender.com`
- Vérifier en navigateur / curl :
  - `/api/health` → `"status":"ok"` (après cold start éventuel)
  - `/api/metrics` → texte Prometheus contenant `jamarket_up`

```powershell
Invoke-RestMethod https://jamarket-api.onrender.com/api/health
Invoke-WebRequest https://jamarket-api.onrender.com/api/metrics | Select-Object -ExpandProperty Content
```

## 1. Compte Grafana Cloud

1. S’inscrire sur <https://grafana.com/auth/sign-up/create-user>
2. Créer un stack (ex. `jamarket`)
3. Ouvrir Grafana → **Connections** → **Data sources** (Prometheus hébergé déjà provisionné)

## 2. Ingestion des métriques

Deux modes possibles ; retenir **A** si disponible dans l’UI, sinon **B**.

### A — Scrape HTTP d’un endpoint Prometheus public

1. **Connections → Add new connection** → chercher « Prometheus » / « Metrics endpoint » / « Infinity »
2. Configurer l’URL : `https://jamarket-api.onrender.com/api/metrics`
3. Intervalle de scrape : **60s**
4. Job name / label : `jamarket-api`

### B — Grafana Alloy / Agent (remote write)

Si le stack impose un agent :

1. Installer Alloy selon la doc Grafana Cloud « Send metrics »
2. Scraper `http://localhost:3000/api/metrics` en local pour la démo, ou l’URL Render en prod
3. Remote write vers l’endpoint Prometheus du stack (URL + token fournis par Grafana)

> Sur Render free, préférer le scrape externe (A) : pas de process agent permanent.

## 3. Dashboard minimal

Créer un dashboard **Jamarket API** avec :

| Panel              | Requête PromQL                                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Process up         | `jamarket_up`                                                                                                                    |
| DB up              | `jamarket_db_up`                                                                                                                 |
| Uptime             | `jamarket_process_uptime_seconds`                                                                                                |
| Req. HTTP          | `sum(rate(jamarket_http_requests_total[5m])) by (status_code)`                                                                   |
| Taux 5xx           | `sum(rate(jamarket_http_requests_total{status_code=~"5.."}[5m])) / clamp_min(sum(rate(jamarket_http_requests_total[5m])), 1e-9)` |
| Uploads Cloudinary | `sum(rate(jamarket_cloudinary_uploads_total[10m])) by (result)`                                                                  |
| Auth failures      | `sum(rate(jamarket_auth_failures_total[10m])) by (flow)`                                                                         |

Exporter le JSON du dashboard (Share → Export) et l’archiver dans le dossier preuves RNCP.

## 4. Alertes

**Alerting → Alert rules → New alert rule**

### Règle 1 — DB down

- Condition : `jamarket_db_up < 1`
- For : `2m`
- Label : `severity=critical`, `service=jamarket-api`
- Contact point : email personnel / scolaire

### Règle 2 — Pic 5xx (optionnel)

- Expression : taux 5xx (requête ci-dessus) `> 0.05`
- For : `5m`

### Règle 3 — Probe health (Synthetic Monitoring)

1. Activer **Synthetic Monitoring** (ou UptimeRobot gratuit en secours)
2. Check HTTP `GET https://jamarket-api.onrender.com/api/health`
3. Valider que le corps contient `"status":"ok"` **ou** code HTTP 200 + délai max 30–60 s (cold start)

## 5. Test de preuve

1. Générer du trafic (parcourir le catalogue, login échoué volontaire)
2. Attendre 1–2 scrapes → panels non vides
3. (Optionnel) Simuler DB down en local avec `DATABASE_URL` invalide → `jamarket_db_up 0` + health `degraded`
4. Captures d’écran : dashboard, règle d’alerte, email reçu
5. Coller les captures dans le dossier de synthèse Bloc 4

## 6. Variables Render

| Variable     | Obligatoire  | Usage                 |
| ------------ | ------------ | --------------------- |
| `SENTRY_DSN` | pour C4.2.1  | Issues Sentry         |
| (aucune)     | pour metrics | `/api/metrics` public |

Pas de secret Grafana côté API si scrape pull externe.
