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

  // El badge de la campana cuenta lo no leído creado DESPUÉS de la última vez que el usuario
  // abrió la campana (en cualquier navegador/dispositivo — se guarda en el usuario, no en
  // localStorage). Así el punto rojo se limpia al abrir la campana pero no se pierde ese
  // estado al entrar desde otro navegador; el resaltado de cada notificación individual en la
  // lista sigue dependiendo solo de `leida`, sin cambios.
  async noLeidasCount(usuarioId: string): Promise<number> {
    const usuario = await this.prisma.tercero.findUnique({ where: { id: usuarioId }, select: { notificacionesVistasEn: true } });
    return this.prisma.notificacion.count({
      where: {
        usuarioId,
        leida: false,
        ...(usuario?.notificacionesVistasEn ? { createdAt: { gt: usuario.notificacionesVistasEn } } : {}),
      },
    });
  }

  async marcarVistas(usuarioId: string): Promise<void> {
    await this.prisma.tercero.update({ where: { id: usuarioId }, data: { notificacionesVistasEn: new Date() } });
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
