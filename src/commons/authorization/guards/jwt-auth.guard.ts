import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '@app/commons/decorators/public.decorator';
import { Constants } from '@app/constants/constants';
import { LoggerExtensions } from '@app/commons/logger.extensions';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException(Constants.Error.AUTHORIZATION_HEADER_NOT_PROVIDED);
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);

      // Un token "pendiente" (emitido tras usuario/contraseña, antes de validar el código 2FA)
      // no es una sesión completa — solo sirve para los endpoints de /auth/2fa/*, que lo validan
      // ellos mismos. No debe autorizar ningún otro endpoint.
      if (payload?.type === 'PENDING_2FA') {
        throw new UnauthorizedException(Constants.Error.AUTHORIZATION_TOKEN_INVALID);
      }

      request['user'] = payload;

      LoggerExtensions.writeDebug(this.logger, 'JWT validado correctamente', {
        userId: payload.sub,
        perfilId: payload.perfilId,
      });

      return true;
    } catch {
      LoggerExtensions.writeWarning(this.logger, 'JWT inválido o expirado', {
        path: request.path,
        method: request.method,
      });
      throw new UnauthorizedException(Constants.Error.AUTHORIZATION_TOKEN_INVALID);
    }
  }

  private extractToken(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return null;
    return authHeader.split(' ')[1];
  }
}
