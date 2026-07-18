/**
 * E2E Vitest — parcours vitaux Jamarket (sans Supertest).
 * Prérequis : DATABASE_URL pointant vers jamarket_test_db (via .env.test) + seed.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  apiRequest,
  createE2eApp,
  type E2eContext,
} from './helpers/e2e-app';

const SEED_PASSWORD = 'Password123!';
const CLIENT_EMAIL = 'client@example.fr';
const ADMIN_EMAIL = 'admin@jamarket.fr';
const EMPLOYEE_EMAIL = 'jean.dupont@jamarket.fr';

describe('Parcours vitaux (e2e)', () => {
  let ctx: E2eContext;
  let prisma: PrismaService;
  let publicAdId: number;
  let freeVehiculeId: number;
  let createdAdId: number | undefined;

  beforeAll(async () => {
    ctx = await createE2eApp();
    prisma = ctx.app.get(PrismaService);

    const ad = await prisma.ad.findFirst({
      where: { isActive: true, isArchived: false, deletedAt: null },
      orderBy: { id: 'asc' },
    });
    if (!ad) {
      throw new Error('Seed requis : aucune annonce active dans jamarket_test_db');
    }
    publicAdId = ad.id;

    const vehicule = await prisma.vehicule.create({
      data: {
        modelId: 1,
        kilometer: 1000,
        year: 2024,
        doorsNumber: 5,
        power: '100ch',
        fuel: 'essence',
        color: 'Bleu',
        vehiculeYear: 2024,
        vehiculeTypeId: 3,
      },
    });
    freeVehiculeId = vehicule.id;
  }, 60_000);

  afterAll(async () => {
    if (createdAdId) {
      await prisma.ad.deleteMany({ where: { id: createdAdId } }).catch(() => undefined);
    }
    await prisma.vehicule.deleteMany({ where: { id: freeVehiculeId } }).catch(() => undefined);
    await ctx.app.close();
  });

  it('auth client : register puis login', async () => {
    const email = `e2e.client.${Date.now()}@example.fr`;

    const register = await apiRequest(ctx.baseUrl, 'POST', '/auth/register', {
      body: {
        name: 'E2E',
        lastName: 'Client',
        email,
        password: SEED_PASSWORD,
      },
    });
    expect(register.status).toBe(201);
    expect(register.json).toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });

    const login = await apiRequest(ctx.baseUrl, 'POST', '/auth/login', {
      body: { email, password: SEED_PASSWORD },
    });
    expect(login.status).toBe(200);
    expect(login.json).toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });
  });

  it('auth admin : login back-office', async () => {
    const login = await apiRequest(ctx.baseUrl, 'POST', '/auth/admin/login', {
      body: { email: ADMIN_EMAIL, password: SEED_PASSWORD },
    });
    expect(login.status).toBe(200);
    expect(login.json).toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });

    const profile = await apiRequest(ctx.baseUrl, 'GET', '/auth/admin/me', {
      token: (login.json as { accessToken: string }).accessToken,
    });
    expect(profile.status).toBe(200);
    expect(profile.json).toMatchObject({ email: ADMIN_EMAIL });
  });

  it('catalogue / recherche filtrée', async () => {
    const search = await apiRequest(
      ctx.baseUrl,
      'GET',
      '/ads?brand=1&priceMin=1000',
    );
    expect(search.status).toBe(200);
    const payload = search.json as {
      data?: unknown[];
      meta?: { total?: number };
    };
    expect(payload).toMatchObject({
      data: expect.any(Array),
      meta: { total: expect.any(Number) },
    });
    expect(payload.meta!.total).toBeGreaterThan(0);
  });

  it('consultation fiche annonce', async () => {
    const detail = await apiRequest(ctx.baseUrl, 'GET', `/ads/${publicAdId}`);
    expect(detail.status).toBe(200);
    expect(detail.json).toMatchObject({
      id: publicAdId,
      label: expect.any(String),
      price: expect.any(Number),
    });
  });

  it('CRUD annonce (employé)', async () => {
    const login = await apiRequest(ctx.baseUrl, 'POST', '/auth/admin/login', {
      body: { email: EMPLOYEE_EMAIL, password: SEED_PASSWORD },
    });
    expect(login.status).toBe(200);
    const token = (login.json as { accessToken: string }).accessToken;

    const created = await apiRequest(ctx.baseUrl, 'POST', '/ads', {
      token,
      body: {
        label: 'E2E Annonce test Vitest',
        description: 'Annonce créée par la suite e2e parcours vitaux.',
        price: 11111,
        vehiculeId: freeVehiculeId,
        isActive: true,
      },
    });
    expect(created.status).toBe(201);
    createdAdId = (created.json as { id: number }).id;
    expect(createdAdId).toEqual(expect.any(Number));

    const updated = await apiRequest(ctx.baseUrl, 'PATCH', `/ads/${createdAdId}`, {
      token,
      body: { price: 12222 },
    });
    expect(updated.status).toBe(200);
    expect(updated.json).toMatchObject({ id: createdAdId, price: 12222 });

    const removed = await apiRequest(ctx.baseUrl, 'DELETE', `/ads/${createdAdId}`, {
      token,
    });
    expect(removed.status).toBe(204);
  });

  it('accès refusé sans token / droits insuffisants', async () => {
    const withoutToken = await apiRequest(ctx.baseUrl, 'POST', '/ads', {
      body: {
        label: 'Interdit',
        description: 'Sans token',
        price: 1000,
        vehiculeId: freeVehiculeId,
      },
    });
    expect(withoutToken.status).toBe(401);

    const clientLogin = await apiRequest(ctx.baseUrl, 'POST', '/auth/login', {
      body: { email: CLIENT_EMAIL, password: SEED_PASSWORD },
    });
    expect(clientLogin.status).toBe(200);
    const clientToken = (clientLogin.json as { accessToken: string }).accessToken;

    const forbidden = await apiRequest(ctx.baseUrl, 'POST', '/ads', {
      token: clientToken,
      body: {
        label: 'Interdit client',
        description: 'Droits insuffisants',
        price: 1000,
        vehiculeId: freeVehiculeId,
      },
    });
    expect([401, 403]).toContain(forbidden.status);
  });
});
