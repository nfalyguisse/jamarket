import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient, RightEnum } from '../generated/prisma/client';
import * as bcrypt from 'bcrypt';
import { DEMO_ADS } from './data/demo-ads';

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL est requis pour le seed');
  }

  // Render (et la plupart des Postgres cloud) exigent SSL depuis l’extérieur
  const needsSsl =
    /sslmode=require/i.test(connectionString) ||
    /render\.com/i.test(connectionString) ||
    process.env.PGSSLMODE === 'require';

  const pool = new Pool({
    connectionString,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 20_000,
    idleTimeoutMillis: 10_000,
  });

  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

const prisma = createPrismaClient();

/** `npm run prisma:seed:prod` = seed référentiel uniquement (sans démo). */
if (process.env.npm_lifecycle_event === 'prisma:seed:prod') {
  process.env.SEED_INCLUDE_DEMO = 'false';
}

/** Annonces / users démo : activé par défaut (y compris en prod). Désactiver avec SEED_INCLUDE_DEMO=false */
const includeDemo = process.env.SEED_INCLUDE_DEMO !== 'false';

async function seedRoles() {
  const adminRole = await prisma.role.upsert({
    where: { id: 1 },
    update: {
      label: 'Admin',
      rights: [
        RightEnum.ADMIN,
        RightEnum.CREATE_AD,
        RightEnum.DELETE_AD,
        RightEnum.MANAGE_USER,
        RightEnum.SUPER_ADMIN,
      ],
    },
    create: {
      label: 'Admin',
      rights: [
        RightEnum.ADMIN,
        RightEnum.CREATE_AD,
        RightEnum.DELETE_AD,
        RightEnum.MANAGE_USER,
        RightEnum.SUPER_ADMIN,
      ],
    },
  });

  const employeeRole = await prisma.role.upsert({
    where: { id: 2 },
    update: {
      label: 'Employee',
      rights: [RightEnum.CREATE_AD, RightEnum.DELETE_AD],
    },
    create: {
      label: 'Employee',
      rights: [RightEnum.CREATE_AD, RightEnum.DELETE_AD],
    },
  });

  const customerRole = await prisma.role.upsert({
    where: { id: 3 },
    update: {
      label: 'Customer',
      rights: [RightEnum.CUSTOMER],
    },
    create: {
      label: 'Customer',
      rights: [RightEnum.CUSTOMER],
    },
  });

  console.log('✅ Roles & permissions');
  return { adminRole, employeeRole, customerRole };
}

async function seedSuperAdmin(adminRoleId: number) {
  const email = process.env.SEED_SUPERADMIN_EMAIL;
  const password = process.env.SEED_SUPERADMIN_PASSWORD;
  const name = process.env.SEED_SUPERADMIN_NAME ?? 'Super';
  const lastName = process.env.SEED_SUPERADMIN_LASTNAME ?? 'Admin';

  if (!email || !password) {
    throw new Error(
      'SEED_SUPERADMIN_EMAIL et SEED_SUPERADMIN_PASSWORD sont requis pour le seed',
    );
  }

  if (password.length < 8) {
    throw new Error('SEED_SUPERADMIN_PASSWORD doit contenir au moins 8 caractères');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const superAdmin = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      lastName,
      password: hashedPassword,
      roleId: adminRoleId,
      isActive: true,
      deletedAt: null,
    },
    create: {
      name,
      lastName,
      email,
      password: hashedPassword,
      roleId: adminRoleId,
      isActive: true,
    },
  });

  console.log(`✅ Super admin : ${email}`);
  return superAdmin;
}

async function seedCatalog() {
  // ─── Types de véhicules classiques ───────────────────────────────────────
  const berline = await prisma.vehiculeType.upsert({
    where: { id: 1 },
    update: { label: 'Berline' },
    create: { label: 'Berline' },
  });
  const suv = await prisma.vehiculeType.upsert({
    where: { id: 2 },
    update: { label: 'SUV' },
    create: { label: 'SUV' },
  });
  const citadine = await prisma.vehiculeType.upsert({
    where: { id: 3 },
    update: { label: 'Citadine' },
    create: { label: 'Citadine' },
  });
  await prisma.vehiculeType.upsert({
    where: { id: 4 },
    update: { label: 'Break' },
    create: { label: 'Break' },
  });
  const utilitaire = await prisma.vehiculeType.upsert({
    where: { id: 5 },
    update: { label: 'Utilitaire' },
    create: { label: 'Utilitaire' },
  });
  await prisma.vehiculeType.upsert({
    where: { id: 6 },
    update: { label: 'Coupé' },
    create: { label: 'Coupé' },
  });
  await prisma.vehiculeType.upsert({
    where: { id: 7 },
    update: { label: 'Monospace' },
    create: { label: 'Monospace' },
  });

  // ─── Marques & modèles classiques ────────────────────────────────────────
  const brands: { id: number; label: string; models: { id: number; label: string }[] }[] = [
    {
      id: 1,
      label: 'Renault',
      models: [
        { id: 1, label: 'Clio' },
        { id: 2, label: 'Mégane' },
        { id: 6, label: 'Captur' },
        { id: 7, label: 'Scenic' },
        { id: 26, label: 'Twingo' },
        { id: 27, label: 'Kangoo' },
      ],
    },
    {
      id: 2,
      label: 'Peugeot',
      models: [
        { id: 3, label: '308' },
        { id: 8, label: '208' },
        { id: 9, label: '3008' },
        { id: 28, label: '207' },
        { id: 29, label: '2008' },
      ],
    },
    {
      id: 3,
      label: 'BMW',
      models: [
        { id: 4, label: 'Série 3' },
        { id: 10, label: 'Série 1' },
        { id: 11, label: 'X1' },
      ],
    },
    {
      id: 4,
      label: 'Volkswagen',
      models: [
        { id: 5, label: 'Golf' },
        { id: 12, label: 'Polo' },
        { id: 13, label: 'Tiguan' },
      ],
    },
    {
      id: 5,
      label: 'Toyota',
      models: [
        { id: 14, label: 'Yaris' },
        { id: 15, label: 'Corolla' },
        { id: 16, label: 'RAV4' },
      ],
    },
    {
      id: 6,
      label: 'Mercedes-Benz',
      models: [
        { id: 17, label: 'Classe A' },
        { id: 18, label: 'Classe C' },
        { id: 19, label: 'GLA' },
      ],
    },
    {
      id: 7,
      label: 'Audi',
      models: [
        { id: 20, label: 'A3' },
        { id: 21, label: 'A4' },
        { id: 22, label: 'Q3' },
      ],
    },
    {
      id: 8,
      label: 'Citroën',
      models: [
        { id: 23, label: 'C3' },
        { id: 24, label: 'C4' },
        { id: 25, label: 'C5 Aircross' },
        { id: 30, label: 'C1' },
        { id: 31, label: 'Berlingo' },
      ],
    },
    {
      id: 9,
      label: 'Dacia',
      models: [
        { id: 32, label: 'Sandero' },
        { id: 33, label: 'Duster' },
      ],
    },
    {
      id: 10,
      label: 'Ford',
      models: [
        { id: 34, label: 'Fiesta' },
        { id: 35, label: 'Focus' },
      ],
    },
    {
      id: 11,
      label: 'Fiat',
      models: [
        { id: 36, label: 'Panda' },
        { id: 37, label: '500' },
      ],
    },
    {
      id: 12,
      label: 'Opel',
      models: [{ id: 38, label: 'Corsa' }],
    },
  ];

  const modelByKey: Record<string, { id: number }> = {};

  for (const brandDef of brands) {
    const brand = await prisma.brand.upsert({
      where: { id: brandDef.id },
      update: { label: brandDef.label },
      create: { label: brandDef.label },
    });

    for (const modelDef of brandDef.models) {
      const model = await prisma.model.upsert({
        where: { id: modelDef.id },
        update: { label: modelDef.label, brandId: brand.id },
        create: { label: modelDef.label, brandId: brand.id },
      });
      modelByKey[`${brandDef.label}:${modelDef.label}`] = model;
    }
  }

  console.log('✅ Types, marques & modèles classiques');

  return {
    types: {
      berline,
      suv,
      citadine,
      utilitaire,
    },
    modelByKey,
  };
}

async function seedDemoUsers(
  employeeRoleId: number,
  customerRoleId: number,
  hashedPassword: string,
) {
  await prisma.user.upsert({
    where: { email: 'jean.dupont@jamarket.fr' },
    update: {},
    create: {
      name: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@jamarket.fr',
      password: hashedPassword,
      roleId: employeeRoleId,
    },
  });

  await prisma.user.upsert({
    where: { email: 'marie.martin@jamarket.fr' },
    update: {},
    create: {
      name: 'Marie',
      lastName: 'Martin',
      email: 'marie.martin@jamarket.fr',
      password: hashedPassword,
      roleId: employeeRoleId,
    },
  });

  await prisma.user.upsert({
    where: { email: 'client@example.fr' },
    update: {},
    create: {
      name: 'Paul',
      lastName: 'Bernard',
      email: 'client@example.fr',
      password: hashedPassword,
      roleId: customerRoleId,
    },
  });

  console.log('✅ Users démo');
}

async function seedDemoAds(
  catalog: Awaited<ReturnType<typeof seedCatalog>>,
  sellerId: number,
) {
  const existingAds = await prisma.ad.count();
  if (existingAds > 0) {
    console.log(`⏭️  Annonces démo ignorées (${existingAds} annonce(s) déjà présentes)`);
    return;
  }

  for (const ad of DEMO_ADS) {
    const model = catalog.modelByKey[ad.modelKey];
    const vehicleType = catalog.types[ad.vehicleType];
    if (!model || !vehicleType) {
      throw new Error(
        `Seed: modèle ou type introuvable pour ${ad.modelKey} / ${ad.vehicleType}`,
      );
    }

    const vehicule = await prisma.vehicule.create({
      data: {
        modelId: model.id,
        kilometer: ad.kilometer,
        year: ad.year,
        doorsNumber: ad.doorsNumber,
        power: ad.power,
        fuel: ad.fuel,
        color: ad.color,
        vehiculeYear: ad.year,
        vehiculeTypeId: vehicleType.id,
      },
    });

    await prisma.ad.create({
      data: {
        label: ad.label,
        description: ad.description,
        price: ad.price,
        vehiculeId: vehicule.id,
        sellerId,
        isActive: true,
        isSold: false,
      },
    });
  }

  console.log(
    `✅ ${DEMO_ADS.length} annonces démo (sans photos, vendeur = super-admin)`,
  );
}

async function main() {
  console.log('🌱 Seeding database...');
  console.log(`   NODE_ENV=${process.env.NODE_ENV ?? 'undefined'} | demo=${includeDemo}`);

  const { adminRole, employeeRole, customerRole } = await seedRoles();
  const superAdmin = await seedSuperAdmin(adminRole.id);
  const catalog = await seedCatalog();

  if (includeDemo) {
    const demoPassword = await bcrypt.hash('Password123!', 10);
    await seedDemoUsers(employeeRole.id, customerRole.id, demoPassword);
    await seedDemoAds(catalog, superAdmin.id);
  } else {
    console.log('⏭️  Seed démo ignoré — SEED_INCLUDE_DEMO=false');
  }

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
