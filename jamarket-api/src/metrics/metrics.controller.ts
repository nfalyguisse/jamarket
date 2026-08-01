import { Controller, Get, Header, Res } from '@nestjs/common';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { MetricsService } from './metrics.service';

@ApiTags('Health')
@ApiExcludeController()
@Controller()
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get('metrics')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Métriques Prometheus (C4.1.2)',
    description:
      'Exposition Prometheus scrapeable par Grafana Cloud : santé, HTTP, métriques métier.',
  })
  async scrape(@Res({ passthrough: true }) res: Response): Promise<string> {
    res.type(this.metrics.getContentType());
    return this.metrics.getMetricsText();
  }
}
