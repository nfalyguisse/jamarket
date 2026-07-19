import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient, RightEnum } from '../generated/prisma/client';
import * as bcrypt from 'bcrypt';

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

  await prisma.user.upsert({
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
  await prisma.vehiculeType.upsert({
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
      ],
    },
    {
      id: 2,
      label: 'Peugeot',
      models: [
        { id: 3, label: '308' },
        { id: 8, label: '208' },
        { id: 9, label: '3008' },
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
      ],
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
    berline,
    suv,
    citadine,
    clio: modelByKey['Renault:Clio'],
    megane: modelByKey['Renault:Mégane'],
    p308: modelByKey['Peugeot:308'],
    serie3: modelByKey['BMW:Série 3'],
    golf: modelByKey['Volkswagen:Golf'],
  };
}

async function seedDemoUsers(
  employeeRoleId: number,
  customerRoleId: number,
  hashedPassword: string,
) {
  const employee1 = await prisma.user.upsert({
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
  return employee1;
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

  const { clio, megane, p308, serie3, golf, berline, citadine } = catalog;

  const vehicleAds = [
    {
      model: clio,
      km: 45000,
      year: 2021,
      doors: 5,
      power: '90ch',
      fuel: 'essence' as const,
      color: 'Rouge',
      vType: citadine,
      price: 12500,
      label: 'Renault Clio 5 - Excellent état',
      desc: 'Voiture de ville parfaite, entretien régulier en concession, carnet à jour.',
    },
    {
      model: clio,
      km: 78000,
      year: 2019,
      doors: 5,
      power: '75ch',
      fuel: 'diesel' as const,
      color: 'Blanc',
      vType: citadine,
      price: 9900,
      label: 'Renault Clio Diesel - Idéale trajet domicile-travail',
      desc: 'Faible consommation, pneus neufs, CT ok.',
    },
    {
      model: megane,
      km: 32000,
      year: 2022,
      doors: 5,
      power: '140ch',
      fuel: 'essence' as const,
      color: 'Gris',
      vType: berline,
      price: 18500,
      label: 'Renault Mégane 4 Phase 2 - Comme neuve',
      desc: 'Options : caméra recul, navigation, sièges chauffants.',
    },
    {
      model: p308,
      km: 55000,
      year: 2020,
      doors: 5,
      power: '130ch',
      fuel: 'diesel' as const,
      color: 'Bleu',
      vType: berline,
      price: 16800,
      label: 'Peugeot 308 Active - Full options',
      desc: 'Excellent rapport qualité/prix, entretien Peugeot.',
    },
    {
      model: p308,
      km: 12000,
      year: 2023,
      doors: 5,
      power: '110ch',
      fuel: 'electrique' as const,
      color: 'Noir',
      vType: berline,
      price: 28900,
      label: 'Peugeot 308 e-308 Électrique',
      desc: 'Autonomie 400km, recharge rapide 100kW, garantie constructeur.',
    },
    {
      model: serie3,
      km: 28000,
      year: 2022,
      doors: 4,
      power: '184ch',
      fuel: 'hybride' as const,
      color: 'Blanc',
      vType: berline,
      price: 39500,
      label: 'BMW Série 3 Hybrid - Luxe & Performance',
      desc: 'Pack M Sport, jantes 18", affichage tête haute.',
    },
    {
      model: serie3,
      km: 67000,
      year: 2019,
      doors: 4,
      power: '190ch',
      fuel: 'diesel' as const,
      color: 'Gris',
      vType: berline,
      price: 24900,
      label: 'BMW 320d - Sportive et économique',
      desc: 'Régulateur adaptatif, park assist, toit ouvrant.',
    },
    {
      model: golf,
      km: 41000,
      year: 2021,
      doors: 5,
      power: '130ch',
      fuel: 'essence' as const,
      color: 'Vert',
      vType: berline,
      price: 21500,
      label: 'Volkswagen Golf 8 - Nouvelle génération',
      desc: 'Équipement complet, écran tactile 10", digital cockpit.',
    },
    {
      model: golf,
      km: 5000,
      year: 2024,
      doors: 5,
      power: '204ch',
      fuel: 'electrique' as const,
      color: 'Rouge',
      vType: berline,
      price: 34900,
      label: 'VW Golf GTE Plug-in Hybrid',
      desc: 'Quasi-neuve, mode 100% électrique 80km, chargeur inclus.',
    },
    {
      model: megane,
      km: 91000,
      year: 2018,
      doors: 5,
      power: '115ch',
      fuel: 'diesel' as const,
      color: 'Marron',
      vType: berline,
      price: 8200,
      label: 'Renault Mégane 4 - Première main',
      desc: 'Rapport qualité/prix imbattable, révision faite à la vente.',
    },
  ];

  for (let i = 0; i < vehicleAds.length; i++) {
    const v = vehicleAds[i];

    const vehicule = await prisma.vehicule.create({
      data: {
        modelId: v.model.id,
        kilometer: v.km,
        year: v.year,
        doorsNumber: v.doors,
        power: v.power,
        fuel: v.fuel,
        color: v.color,
        vehiculeYear: v.year,
        vehiculeTypeId: v.vType.id,
        images: {
          create: [
            { url: `https://picsum.photos/seed/vehicle${i + 1}a/800/600` },
            { url: `https://picsum.photos/seed/vehicle${i + 1}b/800/600` },
          ],
        },
      },
    });

    await prisma.ad.create({
      data: {
        label: v.label,
        description: v.desc,
        price: v.price,
        vehiculeId: vehicule.id,
        sellerId,
        isActive: true,
        isSold: false,
      },
    });
  }

  console.log('✅ 10 annonces démo');
}

async function main() {
  console.log('🌱 Seeding database...');
  console.log(`   NODE_ENV=${process.env.NODE_ENV ?? 'undefined'} | demo=${includeDemo}`);

  const { adminRole, employeeRole, customerRole } = await seedRoles();
  await seedSuperAdmin(adminRole.id);
  const catalog = await seedCatalog();

  if (includeDemo) {
    const demoPassword = await bcrypt.hash('Password123!', 10);
    const seller = await seedDemoUsers(employeeRole.id, customerRole.id, demoPassword);
    await seedDemoAds(catalog, seller.id);
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
