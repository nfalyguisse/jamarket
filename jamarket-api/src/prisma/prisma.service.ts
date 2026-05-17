import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly client: any;

  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    this.client = new PrismaClient({ adapter });
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
