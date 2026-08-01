import { Injectable } from '@nestjs/common';
import { Counter, Gauge, Histogram, Registry } from 'prom-client';
import { PrismaService } from '../prisma/prisma.service';

export type AuthFailureFlow = 'login' | 'admin_login' | 'register';
export type AdsMutationAction = 'create' | 'update' | 'sold';
export type MutationResult = 'success' | 'error';

@Injectable()
export class MetricsService {
  private readonly registry = new Registry();

  private readonly up: Gauge<string>;
  private readonly dbUp: Gauge<string>;
  private readonly processUptime: Gauge<string>;
  private readonly heapUsed: Gauge<string>;

  private readonly httpRequestsTotal: Counter<string>;
  private readonly httpRequestDuration: Histogram<string>;

  private readonly authFailuresTotal: Counter<string>;
  private readonly adsMutationsTotal: Counter<string>;
  private readonly cloudinaryUploadsTotal: Counter<string>;
  private readonly chatConversationsTotal: Counter<string>;
  private readonly wsConnectionsTotal: Counter<string>;

  constructor(private readonly prisma: PrismaService) {
    this.up = new Gauge({
      name: 'jamarket_up',
      help: '1 si le process API Jamarket est vivant',
      registers: [this.registry],
    });
    this.up.set(1);

    this.dbUp = new Gauge({
      name: 'jamarket_db_up',
      help: '1 si le ping PostgreSQL (Prisma) réussit, 0 sinon',
      registers: [this.registry],
    });

    this.processUptime = new Gauge({
      name: 'jamarket_process_uptime_seconds',
      help: 'Uptime du process Node.js en secondes',
      registers: [this.registry],
    });

    this.heapUsed = new Gauge({
      name: 'jamarket_nodejs_heap_used_bytes',
      help: 'Mémoire heap Node.js utilisée (bytes)',
      registers: [this.registry],
    });

    this.httpRequestsTotal = new Counter({
      name: 'jamarket_http_requests_total',
      help: 'Nombre total de requêtes HTTP',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new Histogram({
      name: 'jamarket_http_request_duration_seconds',
      help: 'Durée des requêtes HTTP en secondes',
      labelNames: ['method', 'route'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    this.authFailuresTotal = new Counter({
      name: 'jamarket_auth_failures_total',
      help: 'Échecs d’authentification / inscription (401/409)',
      labelNames: ['flow'],
      registers: [this.registry],
    });

    this.adsMutationsTotal = new Counter({
      name: 'jamarket_ads_mutations_total',
      help: 'Mutations d’annonces (create / update / sold)',
      labelNames: ['action', 'result'],
      registers: [this.registry],
    });

    this.cloudinaryUploadsTotal = new Counter({
      name: 'jamarket_cloudinary_uploads_total',
      help: 'Uploads Cloudinary (succès / échec)',
      labelNames: ['result'],
      registers: [this.registry],
    });

    this.chatConversationsTotal = new Counter({
      name: 'jamarket_chat_conversations_total',
      help: 'Créations de conversations chat',
      labelNames: ['result'],
      registers: [this.registry],
    });

    this.wsConnectionsTotal = new Counter({
      name: 'jamarket_ws_connections_total',
      help: 'Connexions WebSocket chat (OK / refus)',
      labelNames: ['result'],
      registers: [this.registry],
    });
  }

  setDbUp(isUp: boolean): void {
    this.dbUp.set(isUp ? 1 : 0);
  }

  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    durationSeconds: number,
  ): void {
    const status = String(statusCode);
    this.httpRequestsTotal.inc({ method, route, status_code: status });
    this.httpRequestDuration.observe({ method, route }, durationSeconds);
  }

  recordAuthFailure(flow: AuthFailureFlow): void {
    this.authFailuresTotal.inc({ flow });
  }

  recordAdsMutation(action: AdsMutationAction, result: MutationResult): void {
    this.adsMutationsTotal.inc({ action, result });
  }

  recordCloudinaryUpload(result: MutationResult): void {
    this.cloudinaryUploadsTotal.inc({ result });
  }

  recordChatConversation(result: MutationResult): void {
    this.chatConversationsTotal.inc({ result });
  }

  recordWsConnection(result: MutationResult): void {
    this.wsConnectionsTotal.inc({ result });
  }

  async refreshRuntimeGauges(): Promise<void> {
    this.up.set(1);
    this.processUptime.set(process.uptime());
    this.heapUsed.set(process.memoryUsage().heapUsed);

    try {
      await this.prisma.ping();
      this.setDbUp(true);
    } catch {
      this.setDbUp(false);
    }
  }

  async getMetricsText(): Promise<string> {
    await this.refreshRuntimeGauges();
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }
}
