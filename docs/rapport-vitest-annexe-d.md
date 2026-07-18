# Rapport Vitest — Annexe D (Jamarket)

> Preuve de tests pour le dossier de synthèse (compétence **C2.2.2**).  
> Date : 2026-07-18 — branche `feat/tests`.  
> Runner unique : **Vitest** (Jest / Jasmine / Karma / Supertest exclus).

---

## 1. Périmètre volontairement limité

| Type | Périmètre | Justification |
|------|-----------|---------------|
| Unitaires | `AuthService` uniquement | Une fonctionnalité métier critique (JWT, bcrypt, conflits email) |
| E2E | Parcours vitaux API | Filet de sécurité sans suite exhaustive (contrainte solo / RNCP) |
| Hors scope | Ads/Search/Admin unitaires, UI Angular e2e | Éviter l’overkill de couverture globale |

---

## 2. Résultats unitaires (AuthService)

**Commande :** `cd jamarket-api && npm test`  
**Fichier :** `src/auth/auth.service.spec.ts`

| Cas | Résultat |
|-----|----------|
| Register OK + tokens JWT | OK |
| Register email déjà utilisé → `ConflictException` | OK |
| Login OK + tokens | OK |
| Login mauvais mot de passe → `UnauthorizedException` | OK |
| Login compte inactif / soft-delete → `UnauthorizedException` | OK |

**Synthèse CLI (2026-07-18) :**

```
Test Files  2 passed (2)
     Tests  6 passed (6)
```

*(2 fichiers = `auth.service.spec.ts` + smoke `app.controller.spec.ts`)*

### Extrait Arrange / Act / Assert (annexe B)

```ts
it('inscrit un client et retourne les tokens JWT', async () => {
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
});
```

### Coverage ciblé (indicatif)

Commande : `npm run test:cov`  
`auth.service.ts` ≈ **23 % lignes** — normal : seuls `register` / `login` sont couverts, pas le profil admin ni le droit à l’oubli.  
**Pas de seuil global** sur le monorepo (conforme à la règle projet).

---

## 3. Résultats e2e (parcours vitaux)

**Commande :** `cd jamarket-api && npm run test:e2e`  
**Fichier :** `test/vital-paths.e2e-spec.ts`  
**Infra :** HTTP natif (`fetch`) + Nest TestingModule — **pas** Supertest.  
**Base :** `jamarket_test_db` (`.env.test`) + migrations Prisma + seed.

| Scénario | Résultat |
|----------|----------|
| Auth client (register / login) | OK |
| Auth admin (login back-office + `/auth/admin/me`) | OK |
| Catalogue / recherche filtrée (`GET /ads?brand=1&priceMin=1000`) | OK |
| Consultation fiche annonce (`GET /ads/:id`) | OK |
| CRUD annonce employé (POST / PATCH / DELETE) | OK |
| Accès refusé (sans token 401 ; client sans `CREATE_AD` 401/403) | OK |

**Synthèse CLI (2026-07-18) :**

```
Test Files  2 passed (2)
     Tests  7 passed (7)
```

*(6 parcours vitaux + 1 smoke runner)*

---

## 4. Configuration technique (rappel)

| Fichier | Rôle |
|---------|------|
| `vitest.config.ts` | Unitaires (`src/**/*.spec.ts`) + SWC décorateurs |
| `vitest.e2e.config.ts` | E2E (`test/**/*.e2e-spec.ts`) + `.env.test` |
| `package.json` scripts | `test`, `test:watch`, `test:cov`, `test:e2e` |

---

## 5. Captures / logs à coller dans le PDF

1. Sortie `npm test` (6 passed)  
2. Sortie `npm run test:e2e` (7 passed)  
3. Extrait AAA du register (section 2)  
4. Tableau e2e OK/KO (section 3)

---

## 6. Lien Notion

Tâches Testing 1/4 → 4/4 + parent Dossier `[Élim] Vitest` — compétence **C2.2.2**.
