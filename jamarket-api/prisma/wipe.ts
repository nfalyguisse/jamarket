import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../generated/prisma/client';

/**
 * Vide toutes les tables métier (PostgreSQL TRUNCATE … CASCADE).
 * Conservé le schéma / les migrations — adapté à Render.
 *
 * Usage :
 *   npm run prisma:wipe
 *   npm run prisma:reset   (= wipe + seed)
 */
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL est requis');
  }

  const needsSsl =
    /sslmode=require/i.test(connectionString) ||
    /render\.com/i.test(connectionString) ||
    process.env.PGSSLMODE === 'require';

  const pool = new Pool({
    connectionString,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 20_000,
  });

  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

const prisma = createPrismaClient();

async function main() {
  if (process.env.CONFIRM_DB_WIPE !== 'true' && process.env.NODE_ENV === 'production') {
    console.error(
      '❌ Refus : en production, définis CONFIRM_DB_WIPE=true pour confirmer le wipe.',
    );
    process.exit(1);
  }

  console.log('🧹 Vidage de la base (TRUNCATE CASCADE)…');

  // Ordre indifférent grâce à CASCADE ; RESTART IDENTITY remet les séquences à 1
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "message",
      "conversation",
      "favorite",
      "stat",
      "image",
      "ad",
      "vehicule",
      "model",
      "brand",
      "vehicule_type",
      "user",
      "role",
      "theme",
      "display_mode"
    RESTART IDENTITY CASCADE
  `);

  console.log('✅ Base vidée. Tu peux lancer : npm run prisma:seed');
}

main()
  .catch((e) => {
    console.error('❌ Wipe error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
