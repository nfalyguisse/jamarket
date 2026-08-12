import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let metrics: MetricsService;
  const prisma = {
    ping: vi.fn(),
  };

  beforeEach(async () => {
    prisma.ping.mockReset();
    prisma.ping.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    metrics = module.get(MetricsService);
  });

  it('expose un texte Prometheus avec les gauges Jamarket', async () => {
    const text = await metrics.getMetricsText();

    expect(text).toContain('jamarket_up');
    expect(text).toContain('jamarket_db_up');
    expect(text).toContain('jamarket_http_requests_total');
    expect(prisma.ping).toHaveBeenCalled();
  });

  it('enregistre les compteurs métier', async () => {
    metrics.recordAuthFailure('login');
    metrics.recordAdsMutation('create', 'success');
    metrics.recordCloudinaryUpload('error');
    metrics.recordChatConversation('success');
    metrics.recordWsConnection('error');
    metrics.recordHttpRequest('GET', '/api/annonces', 200, 0.012);

    const text = await metrics.getMetricsText();

    expect(text).toContain('jamarket_auth_failures_total');
    expect(text).toContain('flow="login"');
    expect(text).toContain('jamarket_ads_mutations_total');
    expect(text).toContain('jamarket_cloudinary_uploads_total');
    expect(text).toContain('result="error"');
  });
});
