import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../generated/prisma/client';

function createPgAdapter() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
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

  return new PrismaPg(pool);
}

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly client: any;

  constructor() {
    this.client = new PrismaClient({ adapter: createPgAdapter() });
  }

  get role() {
    return this.client.role;
  }
  get user() {
    return this.client.user;
  }
  get brand() {
    return this.client.brand;
  }
  get model() {
    return this.client.model;
  }
  get vehiculeType() {
    return this.client.vehiculeType;
  }
  get vehicule() {
    return this.client.vehicule;
  }
  get image() {
    return this.client.image;
  }
  get ad() {
    return this.client.ad;
  }
  get favorite() {
    return this.client.favorite;
  }
  get conversation() {
    return this.client.conversation;
  }
  get message() {
    return this.client.message;
  }
  get stat() {
    return this.client.stat;
  }
  get displayMode() {
    return this.client.displayMode;
  }
  get theme() {
    return this.client.theme;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async $transaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return this.client.$transaction(fn);
  }

  async ping(): Promise<void> {
    await this.client.$queryRaw`SELECT 1`;
  }

  async onModuleInit(): Promise<void> {
    await this.client.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }
}
