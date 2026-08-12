import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { captureServerException } from '../sentry';

interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, message } = this.extractErrorInfo(exception);

    const body: ErrorResponse = {
      statusCode,
      error: this.getHttpStatusLabel(statusCode),
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[${request.method}] ${request.url} → ${statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
      captureServerException(exception, {
        method: request.method,
        path: request.url,
        statusCode,
      });
    } else {
      this.logger.warn(
        `[${request.method}] ${request.url} → ${statusCode}: ${JSON.stringify(message)}`,
      );
    }

    response.status(statusCode).json(body);
  }

  private extractErrorInfo(exception: unknown): {
    statusCode: number;
    message: string | string[];
  } {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        return { statusCode, message: res };
      }

      if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, unknown>;
        const message = Array.isArray(obj['message'])
          ? (obj['message'] as string[])
          : String(obj['message'] ?? exception.message);
        return { statusCode, message };
      }
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Une erreur interne est survenue',
    };
  }

  private getHttpStatusLabel(statusCode: number): string {
    const labels: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      500: 'Internal Server Error',
    };
    return labels[statusCode] ?? 'Error';
  }
}
