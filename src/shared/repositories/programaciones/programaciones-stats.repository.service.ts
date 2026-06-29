import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma/prisma.service';
import { ProgramacionQueryDto } from '@app/api/operacion/programaciones/dto/programacion-query.dto';

@Injectable()
export class ProgramacionesStatsRepositoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(query: ProgramacionQueryDto) {
    const where: any = {};

    if (query.dateFrom || query.dateTo) {
      where.fechaQx = {};
      if (query.dateFrom) where.fechaQx.gte = new Date(query.dateFrom);
      if (query.dateTo) {
        const end = new Date(query.dateTo);
        end.setHours(23, 59, 59, 999);
        where.fechaQx.lte = end;
      }
    }

    if (query.search) {
      where.OR = [
        { idLegacy: { contains: query.search, mode: 'insensitive' } },
        { hospital: { nombre: { contains: query.search, mode: 'insensitive' } } },
        { medicos: { some: { medico: { nombreCompleto: { contains: query.search, mode: 'insensitive' } } } } },
      ];
    }

    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth();
    const yearStart = new Date(Date.UTC(currentYear, 0, 1));
    const monthStart = new Date(Date.UTC(currentYear, currentMonth, 1));
    const monthEnd = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59, 999));

    const [
      total,
      sinRemision,
      consumoNoValidado,
      sinComision,
      cerradas,
      porSede,
      programacionesAño,
      programacionesMes,
    ] = await this.prisma.$transaction([
      this.prisma.programacion.count({ where }),
      this.prisma.programacion.count({ where: { ...where, sinRemision: true } }),
      this.prisma.programacion.count({ where: { ...where, consumoNoValidado: true } }),
      this.prisma.programacion.count({ where: { ...where, sinComision: true } }),
      this.prisma.programacion.count({ where: { ...where, cerrada: true } }),
      this.prisma.programacion.groupBy({
        by: ['sedeId'],
        where,
        _count: { _all: true },
        orderBy: { sedeId: 'asc' },
      }),
      this.prisma.programacion.count({
        where: { fechaQx: { gte: yearStart, lt: new Date(currentYear + 1, 0, 1) } },
      }),
      this.prisma.programacion.count({
        where: { fechaQx: { gte: monthStart, lte: monthEnd } },
      }),
    ]);

    const sedeIds = porSede.map(s => s.sedeId).filter(Boolean) as string[];
    const sedes = await this.prisma.sede.findMany({ where: { id: { in: sedeIds } } });
    const sedeMap = new Map(sedes.map(s => [s.id, s.nombre]));

    return {
      total,
      sinRemision,
      consumoNoValidado,
      sinComision,
      cerradas,
      programacionesAño,
      programacionesMes,
      porSede: porSede.map(s => ({
        sede: s.sedeId ? sedeMap.get(s.sedeId) ?? s.sedeId : 'Sin sede',
        total: (s._count as any)._all ?? 0,
      })),
    };
  }
}
