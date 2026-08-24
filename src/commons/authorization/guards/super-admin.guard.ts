import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '@app/prisma/prisma.service';
import { esSuperAdminPerfil } from '../super-admin.util';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = (request['user'] as { sub?: string } | undefined)?.sub;

    if (!userId) throw new ForbiddenException('No autorizado');

    const usuario = await this.prisma.tercero.findUnique({
      where: { id: userId },
      select: { perfilId: true, perfil: { select: { nombre: true } } },
    });

    if (!esSuperAdminPerfil(usuario)) {
      throw new ForbiddenException('Esta acción requiere permisos de super-administrador');
    }

    return true;
  }
}
