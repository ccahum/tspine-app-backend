import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '@app/prisma/prisma.service';
import { IS_PUBLIC_KEY } from '@app/commons/decorators/public.decorator';
import { esSuperAdminPerfil } from '../super-admin.util';
import { ALWAYS_ALLOWED_PREFIXES, SUBMODULE_REGISTRY } from '../submodule-registry';

// Segundo APP_GUARD (ver app.module.ts), corre después de JwtAuthGuard — cuando llega acá,
// request['user'] ya está poblado con el payload del JWT ({ sub, correo, perfilId, sedeId }).
//
// A diferencia de SuperAdminGuard (que se aplica por-decorador solo en un puñado de controllers),
// este corre para TODA petición autenticada, así que la mayoría de los perfiles (los que no están
// restringidos) deben pasar de largo lo más rápido posible.
@Injectable()
export class PerfilAccessGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const segmentos = request.path.split('/').filter(Boolean);
    const [primerSegmento] = segmentos;

    if (!primerSegmento || ALWAYS_ALLOWED_PREFIXES.includes(primerSegmento)) return true;

    const user = request['user'] as { perfilId?: string } | undefined;
    // Tercero.perfilId es opcional en el esquema — un usuario sin perfil asignado (ej. algún
    // registro importado de AppSheet) no tiene nada que restringir, así que se le trata igual
    // que a un perfil sin accesoRestringido: acceso total. Bloquearlo sería una regresión, ya
    // que antes de este guard tenía acceso normal con solo el JWT válido.
    if (!user?.perfilId) return true;

    const perfil = await this.prisma.perfil.findUnique({
      where: { id: user.perfilId },
      select: {
        nombre: true,
        accesoRestringido: true,
        vistas: { select: { vistaNombre: true } },
      },
    });
    if (!perfil) return true;

    if (esSuperAdminPerfil({ perfilId: user.perfilId, perfil })) return true;
    if (!perfil.accesoRestringido) return true;

    const prefijoSolicitado = segmentos.slice(0, 2).join('/');
    const prefijosPermitidos = perfil.vistas.flatMap(
      v => SUBMODULE_REGISTRY.find(s => s.id === v.vistaNombre)?.apiPrefixes ?? [],
    );

    if (prefijosPermitidos.includes(prefijoSolicitado)) return true;

    throw new ForbiddenException('No tiene permiso para acceder a este módulo');
  }
}
