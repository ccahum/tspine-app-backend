import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma/prisma.service';

export interface CrearNotificacionInput {
  usuarioId: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  link?: string;
}

// Servicio genérico de notificaciones (campana del header). Cualquier módulo puede inyectarlo
// y llamar crear()/crearParaVarios() con su propio tipo/título/mensaje/link — la campana no
// necesita saber nada sobre el módulo que la origina.
@Injectable()
export class NotificacionesService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(input: CrearNotificacionInput) {
    return this.prisma.notificacion.create({ data: input });
  }

  async crearParaVarios(usuarioIds: string[], data: Omit<CrearNotificacionInput, 'usuarioId'>) {
    if (usuarioIds.length === 0) return;
    await this.prisma.notificacion.createMany({
      data: usuarioIds.map(usuarioId => ({ usuarioId, ...data })),
    });
  }

  async listar(usuarioId: string, limit = 10, skip = 0) {
    return this.prisma.notificacion.findMany({
      where: { usuarioId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    });
  }

  async noLeidasCount(usuarioId: string): Promise<number> {
    return this.prisma.notificacion.count({ where: { usuarioId, leida: false } });
  }

  async marcarLeida(id: string, usuarioId: string) {
    return this.prisma.notificacion.updateMany({
      where: { id, usuarioId },
      data: { leida: true },
    });
  }

  async marcarTodasLeidas(usuarioId: string) {
    return this.prisma.notificacion.updateMany({
      where: { usuarioId, leida: false },
      data: { leida: true },
    });
  }
}
