import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

const SENSITIVE_KEYS = new Set([
  'password', 'passwordhash', 'token', 'accesstoken', 'refreshtoken',
  'authorization', 'jwt', 'secret', 'contrasena', 'contraseña', 'clave',
]);
const MAX_LOGGED_LENGTH = 3000;

// Reemplaza valores de campos sensibles (contraseñas, tokens, etc.) por "***" antes de
// que el request/response se escriba al log — nunca deben quedar en texto plano en disco.
function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? '***' : redact(val);
    }
    return result;
  }
  return value;
}

function safeStringify(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'object' && Object.keys(value).length === 0) return null;
  try {
    const json = JSON.stringify(redact(value));
    if (!json) return null;
    return json.length > MAX_LOGGED_LENGTH ? `${json.slice(0, MAX_LOGGED_LENGTH)}…(truncado)` : json;
  } catch {
    return '[no serializable]';
  }
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const { method, originalUrl, ip, body: requestBody } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: (responseBody) => this.log(method, originalUrl, res.statusCode, start, ip, req, requestBody, responseBody),
        error: (err: { status?: number; response?: unknown }) =>
          this.log(method, originalUrl, err?.status ?? 500, start, ip, req, requestBody, err?.response),
      }),
    );
  }

  private log(
    method: string,
    url: string,
    statusCode: number,
    start: number,
    ip: string | undefined,
    req: Request,
    requestBody: unknown,
    responseBody: unknown,
  ) {
    const durationMs = Date.now() - start;
    const userId = (req['user'] as { sub?: string } | undefined)?.sub;
    const userPart = userId ? ` user=${userId}` : '';
    const reqJson = safeStringify(requestBody);
    const resJson = safeStringify(responseBody);
    const reqPart = reqJson ? ` req=${reqJson}` : '';
    const resPart = resJson ? ` res=${resJson}` : '';
    this.logger.log(`${method} ${url} ${statusCode} ${durationMs}ms ip=${ip}${userPart}${reqPart}${resPart}`);
  }
}
