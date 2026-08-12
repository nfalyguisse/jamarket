import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppController } from './app.controller';
import { MetricsService } from './metrics/metrics.service';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;
  const prisma = {
    ping: vi.fn(),
  };
  const metrics = {
    setDbUp: vi.fn(),
  };

  beforeEach(async () => {
    prisma.ping.mockReset();
    metrics.setDbUp.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: PrismaService, useValue: prisma },
        { provide: MetricsService, useValue: metrics },
      ],
    }).compile();

    appController = module.get(AppController);
  });

  it('retourne status ok quand la base répond', async () => {
    prisma.ping.mockResolvedValue(undefined);

    const result = await appController.health();

    expect(result.status).toBe('ok');
    expect(result.services.database).toBe('ok');
    expect(metrics.setDbUp).toHaveBeenCalledWith(true);
  });
});
