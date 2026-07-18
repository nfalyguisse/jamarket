import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, RightEnum } from '../generated/prisma/client';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Roles ──────────────────────────────────────────────────────────────
  const adminRole = await prisma.role.upsert({
    where: { id: 1 },
    update: {
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
    update: {},
    create: {
      label: 'Employee',
      rights: [RightEnum.CREATE_AD, RightEnum.DELETE_AD],
    },
  });

  const customerRole = await prisma.role.upsert({
    where: { id: 3 },
    update: {},
    create: {
      label: 'Customer',
      rights: [RightEnum.CUSTOMER],
    },
  });

  console.log('✅ Roles created');

  // ─── Users ──────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  await prisma.user.upsert({
    where: { email: 'admin@jamarket.fr' },
    update: {},
    create: {
      name: 'Super',
      lastName: 'Admin',
      email: 'admin@jamarket.fr',
      password: hashedPassword,
      roleId: adminRole.id,
    },
  });

  const employee1 = await prisma.user.upsert({
    where: { email: 'jean.dupont@jamarket.fr' },
    update: {},
    create: {
      name: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@jamarket.fr',
      password: hashedPassword,
      roleId: employeeRole.id,
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
      roleId: employeeRole.id,
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
      roleId: customerRole.id,
    },
  });

  console.log('✅ Users created');

  // ─── Brands & Models ────────────────────────────────────────────────────
  const renault = await prisma.brand.upsert({ where: { id: 1 }, update: {}, create: { label: 'Renault' } });
  const peugeot = await prisma.brand.upsert({ where: { id: 2 }, update: {}, create: { label: 'Peugeot' } });
  const bmw = await prisma.brand.upsert({ where: { id: 3 }, update: {}, create: { label: 'BMW' } });
  const volkswagen = await prisma.brand.upsert({ where: { id: 4 }, update: {}, create: { label: 'Volkswagen' } });

  const clio = await prisma.model.upsert({ where: { id: 1 }, update: {}, create: { label: 'Clio', brandId: renault.id } });
  const megane = await prisma.model.upsert({ where: { id: 2 }, update: {}, create: { label: 'Mégane', brandId: renault.id } });
  const p308 = await prisma.model.upsert({ where: { id: 3 }, update: {}, create: { label: '308', brandId: peugeot.id } });
  const serie3 = await prisma.model.upsert({ where: { id: 4 }, update: {}, create: { label: 'Série 3', brandId: bmw.id } });
  const golf = await prisma.model.upsert({ where: { id: 5 }, update: {}, create: { label: 'Golf', brandId: volkswagen.id } });

  console.log('✅ Brands & Models created');

  // ─── Vehicle Types ───────────────────────────────────────────────────────
  const berline = await prisma.vehiculeType.upsert({ where: { id: 1 }, update: {}, create: { label: 'Berline' } });
  const suv = await prisma.vehiculeType.upsert({ where: { id: 2 }, update: {}, create: { label: 'SUV' } });
  const citadine = await prisma.vehiculeType.upsert({ where: { id: 3 }, update: {}, create: { label: 'Citadine' } });

  console.log('✅ Vehicle types created');

  // ─── Vehicles & Ads ─────────────────────────────────────────────────────
  const vehicleAds = [
    { model: clio, km: 45000, year: 2021, doors: 5, power: '90ch', fuel: 'essence' as const, color: 'Rouge', vType: citadine, price: 12500, label: 'Renault Clio 5 - Excellent état', desc: 'Voiture de ville parfaite, entretien régulier en concession, carnet à jour.' },
    { model: clio, km: 78000, year: 2019, doors: 5, power: '75ch', fuel: 'diesel' as const, color: 'Blanc', vType: citadine, price: 9900, label: 'Renault Clio Diesel - Idéale trajet domicile-travail', desc: 'Faible consommation, pneus neufs, CT ok.' },
    { model: megane, km: 32000, year: 2022, doors: 5, power: '140ch', fuel: 'essence' as const, color: 'Gris', vType: berline, price: 18500, label: 'Renault Mégane 4 Phase 2 - Comme neuve', desc: 'Options : caméra recul, navigation, sièges chauffants.' },
    { model: p308, km: 55000, year: 2020, doors: 5, power: '130ch', fuel: 'diesel' as const, color: 'Bleu', vType: berline, price: 16800, label: 'Peugeot 308 Active - Full options', desc: 'Excellent rapport qualité/prix, entretien Peugeot.' },
    { model: p308, km: 12000, year: 2023, doors: 5, power: '110ch', fuel: 'electrique' as const, color: 'Noir', vType: berline, price: 28900, label: 'Peugeot 308 e-308 Électrique', desc: 'Autonomie 400km, recharge rapide 100kW, garantie constructeur.' },
    { model: serie3, km: 28000, year: 2022, doors: 4, power: '184ch', fuel: 'hybride' as const, color: 'Blanc', vType: berline, price: 39500, label: 'BMW Série 3 Hybrid - Luxe & Performance', desc: 'Pack M Sport, jantes 18", affichage tête haute.' },
    { model: serie3, km: 67000, year: 2019, doors: 4, power: '190ch', fuel: 'diesel' as const, color: 'Gris', vType: berline, price: 24900, label: 'BMW 320d - Sportive et économique', desc: 'Régulateur adaptatif, park assist, toit ouvrant.' },
    { model: golf, km: 41000, year: 2021, doors: 5, power: '130ch', fuel: 'essence' as const, color: 'Vert', vType: berline, price: 21500, label: 'Volkswagen Golf 8 - Nouvelle génération', desc: 'Équipement complet, écran tactile 10", digital cockpit.' },
    { model: golf, km: 5000, year: 2024, doors: 5, power: '204ch', fuel: 'electrique' as const, color: 'Rouge', vType: berline, price: 34900, label: 'VW Golf GTE Plug-in Hybrid', desc: 'Quasi-neuve, mode 100% électrique 80km, chargeur inclus.' },
    { model: megane, km: 91000, year: 2018, doors: 5, power: '115ch', fuel: 'diesel' as const, color: 'Marron', vType: berline, price: 8200, label: 'Renault Mégane 4 - Première main', desc: 'Rapport qualité/prix imbattable, révision faite à la vente.' },
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
        isActive: true,
        isSold: false,
      },
    });
  }

  console.log('✅ 10 vehicle ads created');
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
