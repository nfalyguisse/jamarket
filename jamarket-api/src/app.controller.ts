import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from './prisma/prisma.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  @ApiOperation({
    summary: 'Vérifier la santé de l’API',
    description:
      'Endpoint de supervision exposant l’état global du service Jamarket. ' +
      'Il interroge la base PostgreSQL via un ping Prisma et renvoie un statut ' +
      '"ok" ou "degraded", l’uptime du process et la disponibilité de la base. ' +
      'Utile pour les probes Docker/K8s et le monitoring (compétence C4.1.2).',
  })
  @ApiResponse({
    status: 200,
    description: 'État de santé retourné (ok ou degraded)',
  })
  async health() {
    let database: 'ok' | 'unreachable' = 'unreachable';

    try {
      await this.prisma.ping();
      database = 'ok';
    } catch {
      database = 'unreachable';
    }

    return {
      status: database === 'ok' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      services: { database },
    };
  }
}
