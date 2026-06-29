import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma/prisma.service';
import { ProgramacionQueryDto } from '@app/api/operacion/programaciones/dto/programacion-query.dto';

const normalizeText = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

@Injectable()
export class ProgramacionesRepositoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ProgramacionQueryDto) {
    const { page = 1, limit = 50, dateFrom, dateTo, sedeId, search, cerrada, sinRemision, sinComision, consumoNoValidado } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (dateFrom || dateTo) {
      where.fechaQx = {};
      if (dateFrom) where.fechaQx.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.fechaQx.lte = end;
      }
    }

    if (sedeId) where.sedeId = sedeId;
    if (cerrada !== undefined) where.cerrada = cerrada;
    if (sinRemision !== undefined) where.sinRemision = sinRemision;
    if (sinComision !== undefined) where.sinComision = sinComision;
    if (consumoNoValidado !== undefined) where.consumoNoValidado = consumoNoValidado;

    // Búsqueda normal en BD (sin acentos)
    if (search?.trim()) {
      where.OR = [
        { idLegacy: { equals: search, mode: 'insensitive' } },
        { idLegacy: { contains: search, mode: 'insensitive' } },
        { numProgram: { equals: search, mode: 'insensitive' } },
        { numProgram: { contains: search, mode: 'insensitive' } },
        { hospital: { nombre: { contains: search, mode: 'insensitive' } } },
        { observaciones: { contains: search, mode: 'insensitive' } },
        { medicos: { some: { medico: { nombreCompleto: { contains: search, mode: 'insensitive' } } } } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.programacion.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaQx: 'desc' },
        include: {
          sede: { select: { nombre: true } },
          hospital: { select: { nombre: true, ciudad: true } },
          medicos: { include: { medico: { select: { nombreCompleto: true } } } },
        },
      }),
      this.prisma.programacion.count({ where }),
    ]);

    // Si no encontró resultados y hay búsqueda, intentar con filtro accent-insensitive
    if (total === 0 && search?.trim()) {
      const searchNormalized = normalizeText(search);
      const whereNoSearch: any = { ...where };
      delete whereNoSearch.OR;

      const [allData, totalAll] = await this.prisma.$transaction([
        this.prisma.programacion.findMany({
          where: whereNoSearch,
          orderBy: { fechaQx: 'desc' },
          include: {
            sede: { select: { nombre: true } },
            hospital: { select: { nombre: true, ciudad: true } },
            medicos: { include: { medico: { select: { nombreCompleto: true } } } },
          },
        }),
        this.prisma.programacion.count({ where: whereNoSearch }),
      ]);

      const filtered = allData.filter(p => {
        const idLegacyMatch = normalizeText(p.idLegacy || '').includes(searchNormalized);
        const numProgramMatch = normalizeText(p.numProgram || '').includes(searchNormalized);
        const hospitalMatch = normalizeText(p.hospital?.nombre || '').includes(searchNormalized);
        const observacionesMatch = normalizeText(p.observaciones || '').includes(searchNormalized);
        const medicosMatch = p.medicos.some(m => normalizeText(m.medico.nombreCompleto).includes(searchNormalized));
        return idLegacyMatch || numProgramMatch || hospitalMatch || observacionesMatch || medicosMatch;
      });

      const paginatedData = filtered.slice(skip, skip + limit);
      return { data: paginatedData, total: filtered.length };
    }

    return { data, total };
  }

  async getById(id: string) {
    return this.prisma.programacion.findUnique({
      where: { id },
      include: {
        sede: { select: { nombre: true, id: true } },
        hospital: { select: { nombre: true, ciudad: true, id: true } },
        medicos: { include: { medico: { select: { nombreCompleto: true, id: true } } } },
        tecnicos: { include: { tecnico: { select: { nombreCompleto: true, id: true } } } },
      },
    });
  }

  async updateFlags(id: string, flags: Record<string, boolean | undefined>) {
    const data: any = {};
    if (flags.sinRemision !== undefined) data.sinRemision = flags.sinRemision;
    if (flags.consumoNoValidado !== undefined) data.consumoNoValidado = flags.consumoNoValidado;
    if (flags.sinComision !== undefined) data.sinComision = flags.sinComision;
    if (flags.cerrada !== undefined) data.cerrada = flags.cerrada;
    return this.prisma.programacion.update({
      where: { id },
      data,
      include: {
        sede: { select: { nombre: true } },
        hospital: { select: { nombre: true, ciudad: true } },
        medicos: { include: { medico: { select: { nombreCompleto: true } } } },
      },
    });
  }

  async create(createData: any) {
    const { fechaQx, horaQx, sede, hospital, observaciones, consumo, medicos } = createData;

    let sedeId: string | null = null;
    let hospitalId: string | null = null;

    if (sede) {
      const sedeRecord = await this.prisma.sede.findFirst({
        where: { nombre: { contains: sede, mode: 'insensitive' } },
      });
      sedeId = sedeRecord?.id ?? null;
    }

    if (hospital) {
      const hospitalRecord = await this.prisma.hospital.findFirst({
        where: { nombre: { contains: hospital, mode: 'insensitive' } },
      });
      if (hospitalRecord) {
        hospitalId = hospitalRecord.id;
      } else {
        const newHospital = await this.prisma.hospital.create({
          data: { nombre: hospital },
        });
        hospitalId = newHospital.id;
      }
    }

    const programacion = await this.prisma.programacion.create({
      data: {
        fechaQx: fechaQx ? new Date(fechaQx) : null,
        horaQx: horaQx ?? null,
        sedeId: sedeId,
        hospitalId: hospitalId,
        observaciones: observaciones ?? null,
        consumo: consumo ?? null,
        medicos: {
          create: (medicos || []).map((medicoId: string) => ({
            medicoId: medicoId,
          })),
        },
      },
      include: {
        sede: { select: { nombre: true } },
        hospital: { select: { nombre: true, ciudad: true } },
        medicos: { include: { medico: { select: { nombreCompleto: true } } } },
      },
    });

    return programacion;
  }

  async getMonthComparison() {
    const allPrograms = await this.prisma.programacion.findMany({
      where: { fechaQx: { not: null } },
      select: { fechaQx: true },
    });

    const comparisonMap: Record<number, Record<number, number>> = {};

    allPrograms.forEach((prog) => {
      const fecha = new Date(prog.fechaQx as any);
      const year = fecha.getUTCFullYear();
      const month = fecha.getUTCMonth() + 1;

      if (!comparisonMap[year]) {
        comparisonMap[year] = {};
      }

      comparisonMap[year][month] = (comparisonMap[year][month] || 0) + 1;
    });

    const result = Object.entries(comparisonMap)
      .map(([year, months]) => ({
        year: Number.parseInt(year),
        months,
      }))
      .sort((a, b) => b.year - a.year);

    return result;
  }

  async getSedeDistributionByMonth(year: number, month: number) {
    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const sedeDistribution = await this.prisma.programacion.groupBy({
      by: ['sedeId'],
      where: {
        fechaQx: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      _count: { _all: true },
      orderBy: { sedeId: 'asc' },
    });

    const sedeIds = sedeDistribution.map(s => s.sedeId).filter(Boolean) as string[];
    const sedes = await this.prisma.sede.findMany({ where: { id: { in: sedeIds } } });
    const sedeMap = new Map(sedes.map(s => [s.id, s.nombre]));

    return sedeDistribution.map(s => ({
      sede: s.sedeId ? sedeMap.get(s.sedeId) ?? s.sedeId : 'Sin sede',
      total: (s._count as any)._all ?? 0,
    }));
  }
}
