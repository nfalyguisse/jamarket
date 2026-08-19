import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MetricsService } from './metrics.service';

const EXCLUDED_SUFFIXES = ['/health', '/metrics'];

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const path = (request.originalUrl ?? request.url).split('?')[0];
    if (EXCLUDED_SUFFIXES.some((suffix) => path.endsWith(suffix))) {
      return next.handle();
    }

    const started = process.hrtime.bigint();

    return next.handle().pipe(
      finalize(() => {
        const durationSeconds = Number(process.hrtime.bigint() - started) / 1e9;
        const route = this.resolveRoute(request);
        const method = request.method.toUpperCase();
        const statusCode = response.statusCode || 500;

        this.metrics.recordHttpRequest(
          method,
          route,
          statusCode,
          durationSeconds,
        );
      }),
    );
  }

  /** Path Nest normalisé (`/api/annonces/:id`) pour éviter la cardinalité des IDs. */
  private resolveRoute(request: Request): string {
    const routePath = request.route?.path;
    if (typeof routePath === 'string' && routePath.length > 0) {
      const base = request.baseUrl || '';
      const combined = `${base}${routePath.startsWith('/') ? '' : '/'}${routePath}`;
      return combined.replace(/\/{2,}/g, '/') || 'unknown';
    }
    return 'unmatched';
  }
}
