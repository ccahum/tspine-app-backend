import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@app/prisma/prisma.service';
import { ProgramacionQueryDto } from '@app/api/operacion/programaciones/dto/programacion-query.dto';
import { nowMexico } from '@app/commons/date.utils';

const normalizeText = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

@Injectable()
export class ProgramacionesRepositoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ProgramacionQueryDto) {
    const { page = 1, limit = 50, dateFrom, dateTo, sedeId, search, cerrada, sinRemision, sinComision, consumoNoValidado, conRequisicion } = query;
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
    if (cerrada !== undefined) where.switch = cerrada;

    // sinRemision / sinComision / consumoNoValidado se combinan con AND porque más de uno puede tocar
    // el mismo campo de relación (ej. "remisiones"), y no se pueden pisar entre sí ni con el OR de búsqueda.
    const andConditions: any[] = [];
    if (sinRemision !== undefined) {
      andConditions.push({ remisiones: sinRemision ? { none: {} } : { some: {} } });
    }
    if (sinComision !== undefined) {
      // Una comisión (Det_Tecnico) puede ligarse directo a la programación o a través de una de sus remisiones
      andConditions.push(
        sinComision
          ? { detTecnicos: { none: {} }, remisiones: { every: { detTecnicos: { none: {} } } } }
          : { OR: [{ detTecnicos: { some: {} } }, { remisiones: { some: { detTecnicos: { some: {} } } } }] },
      );
    }
    if (consumoNoValidado !== undefined) {
      // "Sin validar" = no tiene ningún DetConsumo, o tiene al menos uno sin ValConsumo relacionado
      andConditions.push(
        consumoNoValidado
          ? { OR: [{ detConsumos: { none: {} } }, { detConsumos: { some: { valConsumos: { none: {} } } } }] }
          : { AND: [{ detConsumos: { some: {} } }, { detConsumos: { every: { valConsumos: { some: {} } } } }] },
      );
    }
    if (conRequisicion) andConditions.push({ requisiciones: { some: {} } });
    if (andConditions.length) where.AND = andConditions;

    // Búsqueda normal en BD (sin acentos)
    if (search?.trim()) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
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
        orderBy: [{ fechaQx: 'desc' }, { horaQx: 'asc' }],
        include: {
          sede: { select: { nombre: true } },
          hospital: { select: { nombre: true, ciudadCat: { select: { nombre: true } } } },
          medicos: { include: { medico: { select: { nombreCompleto: true } } } },
        },
      }),
      this.prisma.programacion.count({ where }),
    ]);

    const dataConIndicadores = await this.attachIndicadores(data);

    // Si no encontró resultados y hay búsqueda, intentar con filtro accent-insensitive.
    // Antes esto traía TODA la tabla (con las 6 relaciones incluidas) para filtrar en memoria.
    // Ahora el primer paso es liviano (solo los campos de texto que se comparan), y las
    // relaciones completas solo se piden para los ids que van a mostrarse en esta página.
    if (total === 0 && search?.trim()) {
      const searchNormalized = normalizeText(search);
      const whereNoSearch: any = { ...where };
      delete whereNoSearch.OR;

      const liviano = await this.prisma.programacion.findMany({
        where: whereNoSearch,
        orderBy: [{ fechaQx: 'desc' }, { horaQx: 'asc' }],
        select: {
          id: true,
          numProgram: true,
          observaciones: true,
          hospital: { select: { nombre: true } },
          medicos: { select: { medico: { select: { nombreCompleto: true } } } },
        },
      });

      const idsFiltrados = liviano
        .filter(p => {
          const idMatch = normalizeText(p.id).includes(searchNormalized);
          const numProgramMatch = normalizeText(p.numProgram || '').includes(searchNormalized);
          const hospitalMatch = normalizeText(p.hospital?.nombre || '').includes(searchNormalized);
          const observacionesMatch = normalizeText(p.observaciones || '').includes(searchNormalized);
          const medicosMatch = p.medicos.some(m => normalizeText(m.medico.nombreCompleto).includes(searchNormalized));
          return idMatch || numProgramMatch || hospitalMatch || observacionesMatch || medicosMatch;
        })
        .map(p => p.id);

      const idsPagina = idsFiltrados.slice(skip, skip + limit);
      const dataCompleta = await this.prisma.programacion.findMany({
        where: { id: { in: idsPagina } },
        include: {
          sede: { select: { nombre: true } },
          hospital: { select: { nombre: true, ciudadCat: { select: { nombre: true } } } },
          medicos: { include: { medico: { select: { nombreCompleto: true } } } },
        },
      });
      const porId = new Map(dataCompleta.map(p => [p.id, p]));
      const paginatedData = idsPagina.map(id => porId.get(id)!).filter(Boolean);
      const paginatedDataConIndicadores = await this.attachIndicadores(paginatedData);

      return { data: paginatedDataConIndicadores, total: idsFiltrados.length };
    }

    return { data: dataConIndicadores, total };
  }

  // sinRemision/sinComision/consumoNoValidado antes se calculaban en JS trayendo, para cada
  // programación de la página, TODAS sus remisiones y detConsumos (con conteos anidados) — un
  // join potencialmente enorme solo para saber "¿hay alguna?"/"¿todas están en 0?". Se reemplaza
  // por una sola consulta de agregados (subconsultas correlacionadas, sin JOIN de tablas 1-a-N
  // entre sí para evitar fan-out) que calcula lo mismo para todos los ids de la página de una vez.
  //
  // Derivación de sinComision: en la fórmula original, "sinComision = (propias == 0) AND todas las
  // remisiones tienen 0 comisiones" — como los conteos son >= 0, esto equivale exactamente a
  // "propias + suma de comisiones de todas las remisiones == 0" (si la suma es 0, cada término
  // individual también lo es).
  private async attachIndicadores<T extends { id: string }>(rows: T[]) {
    if (rows.length === 0) return [] as (T & { sinRemision: boolean; sinComision: boolean; consumoNoValidado: boolean })[];

    const ids = rows.map(r => r.id);
    const agregados = await this.prisma.$queryRaw<
      { id: string; remisiones_count: bigint; total_comisiones: bigint; det_consumos_count: bigint; det_consumos_validados: bigint }[]
    >`
      SELECT
        p.id,
        (SELECT COUNT(*) FROM remisiones r WHERE r.programacion_id = p.id) AS remisiones_count,
        (
          (SELECT COUNT(*) FROM det_tecnicos dt WHERE dt.programacion_id = p.id) +
          (SELECT COUNT(*) FROM det_tecnicos dt JOIN remisiones r ON dt.remision_id = r.id WHERE r.programacion_id = p.id)
        ) AS total_comisiones,
        (SELECT COUNT(*) FROM det_consumos dc WHERE dc.programacion_id = p.id) AS det_consumos_count,
        (SELECT COUNT(*) FROM det_consumos dc WHERE dc.programacion_id = p.id AND EXISTS (SELECT 1 FROM val_consumo vc WHERE vc.det_consumo_id = dc.id)) AS det_consumos_validados
      FROM programaciones p
      WHERE p.id IN (${Prisma.join(ids)})
    `;

    const porId = new Map(agregados.map(a => [a.id, a]));

    return rows.map(r => {
      const a = porId.get(r.id);
      const remisionesCount = Number(a?.remisiones_count ?? 0);
      const totalComisiones = Number(a?.total_comisiones ?? 0);
      const detConsumosCount = Number(a?.det_consumos_count ?? 0);
      const detConsumosValidados = Number(a?.det_consumos_validados ?? 0);
      return {
        ...r,
        sinRemision: remisionesCount === 0,
        sinComision: totalComisiones === 0,
        consumoNoValidado: detConsumosCount === 0 || detConsumosValidados < detConsumosCount,
      };
    });
  }

  // Endpoint liviano para el Calendario — antes reutilizaba findAll() pidiendo limit=10000 con
  // las 6 relaciones/conteos completos por fila en CADA carga del calendario. Solo trae lo que
  // esa vista de verdad pinta (fecha/hora, sede, nombres de médicos), sin paginar (el calendario
  // agrupa por día del lado del cliente y necesita el rango completo visible).
  async findAllForCalendar(dateFrom?: string, dateTo?: string) {
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

    return this.prisma.programacion.findMany({
      where,
      orderBy: [{ fechaQx: 'desc' }, { horaQx: 'asc' }],
      select: {
        id: true,
        fechaQx: true,
        horaQx: true,
        sede: { select: { nombre: true } },
        medicos: { select: { medico: { select: { nombreCompleto: true } } } },
      },
    });
  }

  async getById(id: string) {
    const [programacion, remisionesDefinitivas, notasCredito, comisionesResult, comisionesDetalleResult, valConsumosCosto] =
      await this.prisma.$transaction([
        this.prisma.programacion.findUnique({
          where: { id },
          include: {
            sede: { select: { nombre: true, id: true } },
            hospital: { select: { nombre: true, id: true, ciudadCat: { select: { nombre: true } }, tercero: { select: { id: true, nombreCompleto: true } } } },
            medicos: { include: { medico: { select: { nombreCompleto: true, id: true } } } },
            tecnicos: { include: { tecnico: { select: { nombreCompleto: true, id: true } } } },
            remisiones: { select: { _count: { select: { detTecnicos: true } } } },
            detConsumos: { select: { _count: { select: { valConsumos: true } } } },
            _count: { select: { detTecnicos: true } },
          },
        }),
        this.prisma.remision.findMany({
          where: { programacionId: id, estado: 'Definitiva' },
          select: { id: true, porcentajeDcto: true, vrDctoPesos: true },
        }),
        // NotaCredito → Factura → Remision → Programacion
        this.prisma.notaCredito.findMany({
          where: { factura: { remision: { programacionId: id } } },
          select: { valor: true, total: true, porcentaje: true },
        }),
        // SUM(Det_Tecnicos[V/R COMIS. O BONIFIC.]) — valor base almacenado en sheets
        this.prisma.detTecnico.aggregate({
          where: {
            OR: [
              { programacionId: id },
              { remision: { programacionId: id } },
            ],
          },
          _sum: { vrComision: true },
        }),
        // SUM(Det_Tecnicos_Detalles[VALOR]) — desglose adicional por AppSheet formula
        this.prisma.detTecnicoDetalle.aggregate({
          where: {
            OR: [
              { programacionId: id },
              { remision: { programacionId: id } },
              { detTecnico: { programacionId: id } },
              { detTecnico: { remision: { programacionId: id } } },
            ],
          },
          _sum: { valor: true },
        }),
        // VAL CANT. USADA * COSTO ACTUAL por ValConsumo, excluyendo categoría RENTA y eliminados
        this.prisma.valConsumo.findMany({
          where: { programacionId: id, eliminar: { not: true } },
          select: {
            costoActual: true,
            producto: { select: { categoriaId: true } },
            lotes: { select: { cantidad: true } },
          },
        }),
      ]);

    if (!programacion) return null;

    // Subtotal por remisión: SUM(detConsumo.valor donde eliminar <> true)
    const remisionIds = remisionesDefinitivas.map((r) => r.id);
    const detAggregates = remisionIds.length
      ? await this.prisma.detConsumo.groupBy({
          by: ['remisionId'],
          where: { remisionId: { in: remisionIds }, eliminar: { not: true } },
          _sum: { valor: true },
        })
      : [];

    const subtotalPorRemision = new Map(
      detAggregates.map((a) => [a.remisionId, Number(a._sum.valor ?? 0)]),
    );

    let total = 0;
    let descuentos = 0;

    for (const rem of remisionesDefinitivas) {
      const subtotal = subtotalPorRemision.get(rem.id) ?? 0;
      total += subtotal;
      // V/R DCTO = subtotal * %Dto + V/R DCTO $ — porcentajeDcto se guarda como "10" (10%), no como fracción
      descuentos += subtotal * (Number(rem.porcentajeDcto ?? 0) / 100) + Number(rem.vrDctoPesos ?? 0);
    }

    // VALOR NC = valor + (total * porcentaje) — porcentaje se guarda como "12" (12%), no como fracción
    const nc = notasCredito.reduce((acc, n) => {
      return acc + Number(n.valor ?? 0) + Number(n.total ?? 0) * (Number(n.porcentaje ?? 0) / 100);
    }, 0);

    const baseIngreso = total - descuentos - nc;
    const comisiones  = Number(comisionesResult._sum.vrComision ?? 0) +
                        Number(comisionesDetalleResult._sum.valor ?? 0);

    // COSTO TOTAL = SUM(costoActual * SUM(lotes.cantidad)) excl. categoría RENTA
    const costoTotal = valConsumosCosto
      .filter(vc => (vc.producto?.categoriaId ?? '').toUpperCase() !== 'RENTA')
      .reduce((sum, vc) => {
        const cantTotal = vc.lotes.reduce((s, l) => s + (l.cantidad ?? 0), 0);
        return sum + Number(vc.costoActual ?? 0) * cantTotal;
      }, 0);

    // UTILIDAD BRUTA = BASE INGRESO - SUM(Det_Tecnicos[V/R COMIS. O BONIFIC]) - COSTO TOTAL
    const utilidadBruta = baseIngreso - comisiones - costoTotal;

    return {
      ...programacion,
      total:         total         > 0 ? total         : null,
      descuentos:    descuentos    > 0 ? descuentos    : null,
      nc:            nc            > 0 ? nc            : null,
      baseIngreso:   baseIngreso   > 0 ? baseIngreso   : null,
      comisiones:    comisiones    > 0 ? comisiones    : null,
      costoTotal:    costoTotal    > 0 ? costoTotal    : null,
      utilidadBruta: utilidadBruta > 0 ? utilidadBruta : null,
    };
  }

  async countRemisionesYRequisiciones(id: string) {
    const [remisiones, requisiciones] = await this.prisma.$transaction([
      this.prisma.remision.count({ where: { programacionId: id } }),
      this.prisma.requisicion.count({ where: { programacionId: id } }),
    ]);
    return { remisiones, requisiciones };
  }

  async countRelatedData(id: string) {
    const programacion = await this.prisma.programacion.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            remisiones: true,
            requisiciones: true,
            detConsumos: true,
            detTecnicos: true,
            valConsumos: true,
            detTecnicoDetalles: true,
            remTecnicos: true,
            gastos: true,
            fuentes: true,
            documentos: true,
            tecnicosSugeridos: true,
          },
        },
      },
    });
    return programacion?._count ?? null;
  }

  async delete(id: string) {
    return this.prisma.programacion.delete({ where: { id } });
  }

  async updateFlags(id: string, flags: Record<string, boolean | undefined>) {
    const data: any = {};
    if (flags.cerrada !== undefined) data.switch = flags.cerrada;
    return this.prisma.programacion.update({
      where: { id },
      data,
      include: {
        sede: { select: { nombre: true } },
        hospital: { select: { nombre: true, ciudadCat: { select: { nombre: true } } } },
        medicos: { include: { medico: { select: { nombreCompleto: true } } } },
        remisiones: { select: { _count: { select: { detTecnicos: true } } } },
        detConsumos: { select: { _count: { select: { valConsumos: true } } } },
        _count: { select: { detTecnicos: true } },
      },
    });
  }

  async update(id: string, dto: { fechaQx?: string; horaQx?: string; sedeId?: string; hospitalId?: string; observaciones?: string; consumo?: string; medicoIds?: string[] }) {
    const data: any = {};
    if (dto.fechaQx !== undefined) data.fechaQx = new Date(dto.fechaQx);
    if (dto.horaQx !== undefined) data.horaQx = dto.horaQx;
    if (dto.sedeId !== undefined) data.sedeId = dto.sedeId;
    if (dto.hospitalId !== undefined) data.hospitalId = dto.hospitalId;
    if (dto.observaciones !== undefined) data.observaciones = dto.observaciones;
    if (dto.consumo !== undefined) data.consumo = dto.consumo;

    if (dto.medicoIds !== undefined) {
      await this.prisma.programacionMedico.deleteMany({ where: { programacionId: id } });
      if (dto.medicoIds.length > 0) {
        await this.prisma.programacionMedico.createMany({
          data: dto.medicoIds.map(medicoId => ({ programacionId: id, medicoId })),
        });
      }
    }

    return this.prisma.programacion.update({
      where: { id },
      data,
      include: {
        sede: { select: { id: true, nombre: true } },
        hospital: { select: { id: true, nombre: true, ciudadCat: { select: { nombre: true } } } },
        medicos: { include: { medico: { select: { id: true, nombreCompleto: true } } } },
        remisiones: { select: { _count: { select: { detTecnicos: true } } } },
        detConsumos: { select: { _count: { select: { valConsumos: true } } } },
        _count: { select: { detTecnicos: true } },
      },
    });
  }

  async getSedes() {
    return this.prisma.sede.findMany({
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async getHospitales() {
    return this.prisma.hospital.findMany({
      select: { id: true, nombre: true, ciudadCat: { select: { nombre: true } } },
      orderBy: { nombre: 'asc' },
    });
  }

  async searchMedicos(search?: string) {
    return this.prisma.tercero.findMany({
      where: {
        clasificaciones: { some: { clasificacion: 'DOCTOR' } },
        ...(search?.trim() ? { nombreCompleto: { contains: search, mode: 'insensitive' as const } } : {}),
      },
      select: { id: true, nombreCompleto: true },
      orderBy: { nombreCompleto: 'asc' },
      take: 20,
    });
  }

  private async generateId(): Promise<string> {
    const last = await this.prisma.programacion.findFirst({
      where: { id: { startsWith: 'PRO_' } },
      orderBy: { id: 'desc' },
      select: { id: true },
    });
    if (!last) return 'PRO_0000001';
    const num = Number.parseInt(last.id.replace('PRO_', ''), 10);
    return `PRO_${String(Number.isNaN(num) ? 1 : num + 1).padStart(7, '0')}`;
  }

  async create(dto: { fechaQx?: string; horaQx?: string; sedeId?: string; hospitalId?: string; observaciones?: string; consumo?: string; medicoIds?: string[] }, usuarioId: string) {
    const id = await this.generateId();
    const programacion = await this.prisma.programacion.create({
      data: {
        id,
        creadoPor: usuarioId,
        createdAt: nowMexico(),
        fechaQx: dto.fechaQx ? new Date(dto.fechaQx) : null,
        horaQx: dto.horaQx ?? null,
        sedeId: dto.sedeId ?? null,
        hospitalId: dto.hospitalId ?? null,
        observaciones: dto.observaciones ?? null,
        consumo: dto.consumo ?? null,
        medicos: {
          create: (dto.medicoIds ?? []).map(medicoId => ({ medicoId })),
        },
      },
      include: {
        sede: { select: { nombre: true } },
        hospital: { select: { nombre: true, ciudadCat: { select: { nombre: true } } } },
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
      const fecha = new Date(prog.fechaQx as Date);
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
      total: s._count._all ?? 0,
    }));
  }
}
