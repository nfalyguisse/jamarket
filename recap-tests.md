# Récapitulatif — Branche `feat/tests` (catégorie Testing)

> Document de transmission pour l’agent chargé de rédiger le **dossier de synthèse Jamarket**.  
> Compétence cible : **C2.2.2** (tests unitaires ciblés + e2e parcours vitaux, Vitest uniquement).  
> Mis à jour au fur et à mesure de l’avancement. **Statut global : Terminé (2026-07-18).**

---

## Contexte

| Élément | Détail |
|--------|--------|
| Branche | `feat/tests` |
| Objectif | Accomplir les 4 tâches Notion catégorie **Testing** |
| Outil | Vitest (pas Jest / Jasmine / Karma / Supertest) |
| Périmètre | Unitaires = AuthService uniquement ; E2E = parcours vitaux uniquement |
| Base Notion | [Suivi des tâches Jamarket](https://app.notion.com/p/354910bd68f780299f04cef7db427d60) |
| Rapport annexe D | [`docs/rapport-vitest-annexe-d.md`](docs/rapport-vitest-annexe-d.md) |

---

## Tâches Notion (Tracking)

| # | Tâche | URL Notion | État | Compétence |
|---|--------|------------|------|------------|
| 1/4 | Configurer Vitest (jamarket-api) | [lien](https://app.notion.com/p/362910bd68f78108a6a7f30a2565425d) | **Terminé** | C2.2.2 |
| 2/4 | Unitaires Vitest — AuthService | [lien](https://app.notion.com/p/362910bd68f781ec824cf89115f47dcb) | **Terminé** | C2.2.2 |
| 3/4 | E2E Vitest — parcours vitaux | [lien](https://app.notion.com/p/362910bd68f7815192f4f08148c42038) | **Terminé** | C2.2.2 |
| 4/4 | Rapport Vitest pour annexe D | [lien](https://app.notion.com/p/362910bd68f7812bbcf0e9b361c4c69b) | **Terminé** | C2.2.2 |
| Parent | [Élim] Vitest — unitaires ciblés + e2e | [lien](https://app.notion.com/p/3a1910bd68f781909531f9025f197958) | **Terminé** | C2.2.2 (Dossier) |

---

## Journal d’avancement

### 2026-07-18 — Initialisation

- Branche active : `feat/tests`
- Inventaire Notion des tâches Testing (4 + 1 parent Dossier)
- Création de ce fichier `récap.md` pour transmission dossier de synthèse

### 2026-07-18 — 1/4 Configurer Vitest (Terminé)

- Vitest 4 + `unplugin-swc` / `@swc/core` (métadonnées décorateurs NestJS)
- Fichiers : `jamarket-api/vitest.config.ts`, `jamarket-api/vitest.e2e.config.ts`
- Scripts npm : `test` → `vitest run`, `test:e2e` → config e2e, `test:cov` → coverage v8
- Jest retiré (dépendances + bloc config `package.json` + `test/jest-e2e.json`)
- Smoke unitaire `AppController.health` + smoke e2e runner

### 2026-07-18 — 2/4 Unitaires AuthService (Terminé)

- Specs : `jamarket-api/src/auth/auth.service.spec.ts`
- Mocks : Prisma, JwtService, bcrypt (`vi.mock`)
- 5 cas métier + smoke health → **6 tests unitaires verts**

### 2026-07-18 — 3/4 E2E parcours vitaux (Terminé)

- Helper HTTP natif (`fetch`) : `test/helpers/e2e-app.ts` — **sans Supertest**
- Suite : `test/vital-paths.e2e-spec.ts`
- Infra DB : `jamarket_test_db` + `.env.test` + migrate deploy + seed
- **6 scénarios vitaux + 1 smoke** → 7 tests e2e verts

### 2026-07-18 — 4/4 Rapport annexe D (Terminé)

- Livrable : `docs/rapport-vitest-annexe-d.md`
- Contient tableaux OK/KO, extrait AAA, sorties CLI, notes coverage

---

## Détail des livrables

### 1/4 — Configuration Vitest

| Élément | Détail |
|--------|--------|
| Runner | Vitest 4.1.x |
| Transform | SWC via `unplugin-swc` (`decoratorMetadata: true`) |
| Unit config | `jamarket-api/vitest.config.ts` — include `src/**/*.spec.ts` |
| E2E config | `jamarket-api/vitest.e2e.config.ts` — include `test/**/*.e2e-spec.ts` |
| Scripts | `test`, `test:watch`, `test:cov`, `test:e2e` |
| Remplacé | Jest / ts-jest |
| Validation | `npm test` et `npm run test:e2e` OK |

### 2/4 — Unitaires AuthService

| Cas | Fichier | Statut |
|-----|---------|--------|
| Register OK + tokens | `auth.service.spec.ts` | OK |
| Register email déjà utilisé | idem | OK |
| Login OK + tokens | idem | OK |
| Login mauvais mot de passe | idem | OK |
| Compte inactif / soft-delete | idem | OK |

**Preuve CLI :** `Test Files 2 passed — Tests 6 passed`

**Extrait AAA (annexe B) :**

```ts
// Arrange
prisma.user.findUnique.mockResolvedValue(null);
prisma.role.findFirst.mockResolvedValue(customerRole);
vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
prisma.user.create.mockResolvedValue(customerUser);

// Act
const result = await service.register(registerDto);

// Assert
expect(result).toEqual({
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
});
```

### 3/4 — E2E parcours vitaux

| Scénario | Endpoint(s) | Statut |
|----------|-------------|--------|
| Auth client register/login | `POST /api/auth/register`, `POST /api/auth/login` | OK |
| Auth admin | `POST /api/auth/admin/login`, `GET /api/auth/admin/me` | OK |
| Recherche filtrée | `GET /api/annonces?brand=1&priceMin=1000` | OK |
| Fiche annonce | `GET /api/annonces/:id` | OK |
| CRUD employé | `POST/PATCH/DELETE /api/annonces` | OK |
| Accès refusé | sans token → 401 ; client → 401/403 | OK |

**Preuve CLI :** `Test Files 2 passed — Tests 7 passed`

**Prérequis local :** PostgreSQL (`jamarket_database`), DB `jamarket_test_db`, seed (`Password123!` pour comptes seed).

### 4/4 — Rapport annexe D

Voir le fichier dédié : **`docs/rapport-vitest-annexe-d.md`** (copiable tel quel dans le PDF).

---

## Preuves pour le dossier (annexes B / D)

| Preuve | Emplacement | Statut |
|--------|-------------|--------|
| Extrait Arrange/Act/Assert (Auth) | `récap.md` §2/4 + `docs/rapport-vitest-annexe-d.md` | Prêt |
| Sortie Vitest unitaires | 6 passed (2026-07-18) | Prêt |
| Tableau synthèse e2e OK/KO | ci-dessus + rapport annexe D | Prêt |
| Coverage Auth (indicatif) | `auth.service.ts` ~23 % lignes (ciblé register/login) | Prêt |
| Captures / logs CLI | Rejouer `npm test` / `npm run test:e2e` | Reproductible |

---

## Fichiers créés / modifiés (résumé agent)

| Chemin | Action |
|--------|--------|
| `récap.md` | Créé (transmission) |
| `docs/rapport-vitest-annexe-d.md` | Créé (annexe D) |
| `jamarket-api/vitest.config.ts` | Créé |
| `jamarket-api/vitest.e2e.config.ts` | Créé |
| `jamarket-api/package.json` | Scripts Vitest, retrait Jest |
| `jamarket-api/src/auth/auth.service.spec.ts` | Créé |
| `jamarket-api/src/app.controller.spec.ts` | Adapté (health + mock Prisma) |
| `jamarket-api/test/setup-e2e.ts` | Créé (charge `.env.test`) |
| `jamarket-api/test/helpers/e2e-app.ts` | Créé |
| `jamarket-api/test/vital-paths.e2e-spec.ts` | Créé |
| `jamarket-api/test/app.e2e-spec.ts` | Smoke runner |
| `jamarket-api/test/jest-e2e.json` | Supprimé |

---

## Notes pour l’agent dossier de synthèse

1. **Compétence éliminatoire C2.2.2** : preuves unitaires Auth + e2e vitaux, runner Vitest unique.
2. **Argumentaire** : tests volontairement limités (solo RNCP) — une feature critique + filet e2e, pas de couverture « majorité du code ».
3. **Ne pas confondre** avec le **cahier de recettes** (C2.3.1, catégorie Dossier) — hors scope de cette branche.
4. **Coller dans le PDF** : extrait AAA + tableaux OK/KO + sorties CLI depuis `docs/rapport-vitest-annexe-d.md`.
5. Comptes seed utiles : `client@example.fr`, `admin@jamarket.fr`, `jean.dupont@jamarket.fr` / `Password123!`.
