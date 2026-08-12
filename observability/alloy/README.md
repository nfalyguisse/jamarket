# Grafana Alloy — Jamarket

## Secrets (variables d’environnement)

Dans `config.alloy` :

```alloy
username = env("GRAFANA_CLOUD_USER")
password = env("GRAFANA_CLOUD_TOKEN")
```

`env("NOM")` = lit la variable d’environnement **NOM**.  
Ne pas mettre la valeur dans `env(...)` (`env("2374545")` est incorrect).

Copier `.env.example` → `.env` (gitignoré), puis :

```powershell
cd jamarket\observability\alloy
$env:GRAFANA_CLOUD_USER = "2374545"
$env:GRAFANA_CLOUD_TOKEN = "glc_TON_TOKEN"
alloy run .\config.alloy
```

Préférer lancer **ce** `config.alloy` du repo plutôt que `C:\Program Files\GrafanaLabs\Alloy\config.alloy` (droits admin + risque de désync).

## Vérif

Grafana → Explore → `jamarket_up`
