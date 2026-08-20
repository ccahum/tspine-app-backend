import { randomUUID } from 'node:crypto';
import { Logger } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

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

const logger = new Logger('HTTP');

// Middleware (no interceptor) a propósito: los Guards de NestJS (ej. JwtAuthGuard) corren
// ANTES que los interceptors, así que una petición rechazada por falta/invalidez de token
// nunca llegaría a un interceptor de logging — nunca se vería registrada. El middleware, en
// cambio, corre a nivel de Express antes de que Nest evalúe guards, así que ve TODA petición,
// se autorice o no.
export function loggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, originalUrl, ip, body: requestBody } = req;

  // Identificador único por petición — permite ubicar en el log exactamente esta transacción
  // (útil cuando hay varias peticiones simultáneas entremezcladas) y se lo devolvemos al
  // cliente en un encabezado, para que si alguien reporta un problema puedas ubicarlo sin
  // tener que adivinar por fecha/hora.
  const requestId = randomUUID();
  res.setHeader('X-Request-Id', requestId);

  let responseBody: unknown;
  const originalJson = res.json.bind(res);
  res.json = ((body: unknown) => {
    responseBody = body;
    return originalJson(body);
  }) as typeof res.json;

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const userId = (req['user'] as { sub?: string } | undefined)?.sub;
    const userPart = userId ? ` user=${userId}` : '';
    const reqJson = safeStringify(requestBody);
    const resJson = safeStringify(responseBody);
    const reqPart = reqJson ? ` req=${reqJson}` : '';
    const resPart = resJson ? ` res=${resJson}` : '';
    logger.log(`[${requestId}] ${method} ${originalUrl} ${res.statusCode} ${durationMs}ms ip=${ip}${userPart}${reqPart}${resPart}`);
  });

  next();
}
