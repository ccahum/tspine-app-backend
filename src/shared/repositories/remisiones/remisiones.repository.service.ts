import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ClasificacionTercero, Prisma } from '@prisma/client';
import { randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '@app/prisma/prisma.service';
import { RemisionQueryDto } from '@app/api/operacion/remisiones/dto/remision-query.dto';
import { CreateComisionDto } from '@app/api/operacion/remisiones/dto/create-comision.dto';
import { CreateRequisicionDto } from '@app/api/operacion/remisiones/dto/create-requisicion.dto';
import { CreateDetRequisicionDto } from '@app/api/operacion/remisiones/dto/create-det-requisicion.dto';
import { CreateRemisionDto } from '@app/api/operacion/remisiones/dto/create-remision.dto';
import { UpdateRemisionDto } from '@app/api/operacion/remisiones/dto/update-remision.dto';
import { CreateTecnicoSugeridoDto } from '@app/api/operacion/remisiones/dto/create-tecnico-sugerido.dto';
import { CreateValConsumoDto } from '@app/api/operacion/remisiones/dto/create-val-consumo.dto';
import { CreateValConsumoLoteDto } from '@app/api/operacion/remisiones/dto/create-val-consumo-lote.dto';
import { CreateDocumentoProgramacionDto } from '@app/api/operacion/remisiones/dto/create-documento-programacion.dto';
import { decodeBase64DataUrl, extensionFromMime, mimeFromDataUrl, mimeFromExtension, resolveUploadPath, saveUploadFile, uploadFileExists } from '@app/commons/file-storage.utils';
import { nowMexico } from '@app/commons/date.utils';

// Mismas 5 categorías "cotizables" que CotizacionesService.searchProductos — usado solo cuando
// searchProductos se llama con soloCotizables=true (ej. el buscador de "Pro Val" al validar un
// consumo, que no debe mostrar Instrumental/Equipo/Tapa/Utilería, etc.).
const CATEGORIAS_COTIZABLES = ['Renta', 'Implante', 'Consumible', 'Biológico', 'Refrigerados'];

const normalizeText = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Misma regla que computeConsumoNoValidado en programaciones.service.ts. */
const computeConsumoNoValidado = (p: any): boolean =>
  (p?.detConsumos?.length ?? 0) === 0 || (p?.detConsumos ?? []).some((dc: any) => (dc._count?.valConsumos ?? 0) === 0);

const REMISION_LIST_INCLUDE = {
  tarifa: { select: { nombre: true } },
  empresa: { select: { nombreCompleto: true } },
  programacion: {
    select: {
      id: true,
      numProgram: true,
      fechaQx: true,
      horaQx: true,
      sede: { select: { nombre: true } },
      hospital: { select: { nombre: true, ciudadCat: { select: { nombre: true } } } },
      medicos: { select: { medico: { select: { nombreCompleto: true } } } },
    },
  },
} as const;

@Injectable()
export class RemisionesRepositoryService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateDetTecnicoId(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const id = randomBytes(4).toString('hex');
      const exists = await this.prisma.detTecnico.findUnique({ where: { id }, select: { id: true } });
      if (!exists) return id;
    }
    throw new Error('No se pudo generar un ID único para la comisión');
  }

  private async generateDetTecnicoDetalleId(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const id = randomBytes(4).toString('hex');
      const exists = await this.prisma.detTecnicoDetalle.findUnique({ where: { id }, select: { id: true } });
      if (!exists) return id;
    }
    throw new Error('No se pudo generar un ID único para el detalle de la comisión');
  }

  async createComision(dto: CreateComisionDto) {
    if (!dto.vrComision && !dto.detalles?.length) {
      throw new BadRequestException('Debes indicar un valor de asignación o al menos una línea de detalle.');
    }

    const id = await this.generateDetTecnicoId();
    const detallesData = dto.detalles?.length
      ? await Promise.all(dto.detalles.map(async d => ({
          id: await this.generateDetTecnicoDetalleId(),
          programacionId: dto.programacionId,
          remisionId: d.remisionId,
          productoId: d.productoId,
          valor: d.valor,
        })))
      : undefined;

    return this.prisma.detTecnico.create({
      data: {
        id,
        programacionId: dto.programacionId,
        marcaTiempo: nowMexico(),
        categoria: dto.categoria,
        tipo: dto.tipo,
        tecnicoId: dto.tecnicoId,
        remisionId: dto.remisionId,
        esProgramacion: !dto.remisionId,
        vrComision: dto.vrComision,
        observaciones: dto.observaciones,
        agregarIva: dto.agregarIva,
        cargarPorcentaje: dto.cargarPorcentaje,
        quieresDesglosar: dto.quieresDesglosar,
        seleccioneTipo: dto.seleccioneTipo,
        estadoActual: true,
        detalles: detallesData ? { create: detallesData } : undefined,
      },
    });
  }

  async searchTecnicos(search?: string, clasificacion?: ClasificacionTercero) {
    const searchTerm = search?.trim();
    // SQL crudo (no where/contains de Prisma) para que la búsqueda ignore acentos, igual que
    // searchProductos/searchLotes — Prisma no tiene equivalente a unaccent().
    const searchFilter = searchTerm
      ? Prisma.sql`AND unaccent(t.nombre_completo) ILIKE unaccent(${'%' + searchTerm + '%'})`
      : Prisma.empty;
    const clasificacionFilter = clasificacion
      ? Prisma.sql`AND EXISTS (SELECT 1 FROM tercero_clasificaciones tc WHERE tc.tercero_id = t.id AND tc.clasificacion = ${clasificacion}::"ClasificacionTercero")`
      : Prisma.empty;

    return this.prisma.$queryRaw<{ id: string; nombreCompleto: string | null }[]>`
      SELECT t.id AS id, t.nombre_completo AS "nombreCompleto"
      FROM terceros t
      WHERE 1=1
      ${clasificacionFilter}
      ${searchFilter}
      ORDER BY t.nombre_completo ASC
      LIMIT 20
    `;
  }

  async searchEmpresas(search?: string) {
    return this.prisma.tercero.findMany({
      where: {
        clasificaciones: { some: { clasificacion: 'EMPRESA' } },
        ...(search?.trim() ? { nombreCompleto: { contains: search, mode: 'insensitive' as const } } : {}),
      },
      select: { id: true, nombreCompleto: true },
      orderBy: { nombreCompleto: 'asc' },
      take: 20,
    });
  }

  /**
   * Regla de EMPRESA sugerida para Remisión (traducida de AppSheet Initial value / Suggested values).
   * La excepción de perfil SA del AppSheet original no aplica aquí: perfilId='SA' en nuestra semilla
   * (admin/qatester) es solo para permisos de desarrollo, no corresponde al PERFIL real de AppSheet.
   * - Cubrimiento Distribuidor (1A17) o Particulares (1A15):
   *   - Sede Vallarta/Guadalajara → Cabcari
   *   - Sede Mérida/Cancún → Guillermo Alfredo Gualdrón Bateca
   * - Cualquier otro caso (Hospitales, Aseguradora) → sin sugerencia, se ven las 5 empresas.
   */
  async getEmpresaSugerida(cubrimientoId?: string, sedeId?: string) {
    const cubrimientoAplica = cubrimientoId === '1A17' || cubrimientoId === '1A15';
    if (!cubrimientoAplica) return null;

    let empresaId: string | null = null;
    if (sedeId === 'sede_vallarta' || sedeId === 'sede_guadalajara') {
      empresaId = 'ba7f0d54-102f-4274-a734-9338091459a4'; // Cabcari
    } else if (sedeId === 'sede_merida' || sedeId === 'sede_cancun') {
      empresaId = 'b8bec324-90ee-4b7a-b5b4-d1a4b9f8ebe1'; // Guillermo Alfredo Gualdrón Bateca
    }
    if (!empresaId) return null;

    return this.prisma.tercero.findUnique({ where: { id: empresaId }, select: { id: true, nombreCompleto: true } });
  }

  async searchTecnicosComisionistas(search?: string) {
    const searchTerm = search?.trim();
    const searchFilter = searchTerm
      ? Prisma.sql`AND unaccent(t.nombre_completo) ILIKE unaccent(${'%' + searchTerm + '%'})`
      : Prisma.empty;

    return this.prisma.$queryRaw<{ id: string; nombreCompleto: string | null }[]>`
      SELECT t.id AS id, t.nombre_completo AS "nombreCompleto"
      FROM terceros t
      WHERE EXISTS (SELECT 1 FROM tercero_clasificaciones tc WHERE tc.tercero_id = t.id AND tc.clasificacion = 'COMISIONISTA'::"ClasificacionTercero")
      ${searchFilter}
      ORDER BY t.nombre_completo ASC
      LIMIT 20
    `;
  }

  async findTecnicosSugeridosByProgramacion(programacionId: string) {
    const items = await this.prisma.tecnicoSugerido.findMany({
      where: { programacionId },
      select: {
        id: true,
        tecnicoId: true,
        fechaRegistro: true,
        tecnico: { select: { nombreCompleto: true } },
        registradoPor: { select: { nombreCompleto: true } },
      },
      orderBy: { fechaRegistro: 'desc' },
    });
    return items.map(it => ({
      id: it.id,
      tecnicoId: it.tecnicoId,
      fechaRegistro: it.fechaRegistro,
      tecnico: it.tecnico?.nombreCompleto ?? null,
      registradoPor: it.registradoPor?.nombreCompleto ?? null,
    }));
  }

  async createTecnicoSugerido(dto: CreateTecnicoSugeridoDto, usuarioId: string) {
    return this.prisma.tecnicoSugerido.create({
      data: {
        programacionId: dto.programacionId,
        tecnicoId: dto.tecnicoId,
        registradoPorId: usuarioId,
        fechaRegistro: nowMexico(),
      },
    });
  }

  async deleteTecnicoSugerido(id: string) {
    return this.prisma.tecnicoSugerido.delete({ where: { id } });
  }

  async getCxcStats() {
    const [total, pendiente, enviada] = await this.prisma.$transaction([
      this.prisma.remision.count(),
      this.prisma.remision.count({ where: { cxc: false } }),
      this.prisma.remision.count({ where: { cxc: true } }),
    ]);
    return { total, pendiente, enviada };
  }

  async findAll(query: RemisionQueryDto) {
    const { page = 1, limit = 50, dateFrom, dateTo, estado, search, cxc } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (dateFrom || dateTo) {
      where.creadoEn = {};
      if (dateFrom) where.creadoEn.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.creadoEn.lte = end;
      }
    }

    if (estado) where.estado = estado;
    if (cxc !== undefined) where.cxc = cxc;

    if (search?.trim()) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { numRemision: { contains: search, mode: 'insensitive' } },
        { paciente: { contains: search, mode: 'insensitive' } },
        { anestesiologo: { contains: search, mode: 'insensitive' } },
        { programacion: { hospital: { nombre: { contains: search, mode: 'insensitive' } } } },
        { programacion: { medicos: { some: { medico: { nombreCompleto: { contains: search, mode: 'insensitive' } } } } } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.remision.findMany({
        where,
        skip,
        take: limit,
        orderBy: { creadoEn: 'desc' },
        include: REMISION_LIST_INCLUDE,
      }),
      this.prisma.remision.count({ where }),
    ]);

    // Igual que en Programaciones: antes traía TODA la tabla (con el include completo) para
    // filtrar en memoria. Ahora el primer paso es liviano, y el include completo solo se pide
    // para los ids que van a mostrarse en esta página.
    if (total === 0 && search?.trim()) {
      const searchNormalized = normalizeText(search);
      const whereNoSearch: any = { ...where };
      delete whereNoSearch.OR;

      const liviano = await this.prisma.remision.findMany({
        where: whereNoSearch,
        orderBy: { creadoEn: 'desc' },
        select: {
          id: true,
          numRemision: true,
          paciente: true,
          anestesiologo: true,
          programacion: {
            select: {
              hospital: { select: { nombre: true } },
              medicos: { select: { medico: { select: { nombreCompleto: true } } } },
            },
          },
        },
      });

      const idsFiltrados = liviano
        .filter(r => {
          const idMatch = normalizeText(r.id).includes(searchNormalized);
          const numRemisionMatch = normalizeText(r.numRemision || '').includes(searchNormalized);
          const pacienteMatch = normalizeText(r.paciente || '').includes(searchNormalized);
          const anestesiologoMatch = normalizeText(r.anestesiologo || '').includes(searchNormalized);
          const hospitalMatch = normalizeText(r.programacion?.hospital?.nombre || '').includes(searchNormalized);
          const medicosMatch = (r.programacion?.medicos ?? []).some(m => normalizeText(m.medico.nombreCompleto).includes(searchNormalized));
          return idMatch || numRemisionMatch || pacienteMatch || anestesiologoMatch || hospitalMatch || medicosMatch;
        })
        .map(r => r.id);

      const idsPagina = idsFiltrados.slice(skip, skip + limit);
      const dataCompleta = await this.prisma.remision.findMany({
        where: { id: { in: idsPagina } },
        include: REMISION_LIST_INCLUDE,
      });
      const porId = new Map(dataCompleta.map(r => [r.id, r]));
      const paginatedData = idsPagina.map(id => porId.get(id)!).filter(Boolean);

      return { data: paginatedData, total: idsFiltrados.length };
    }

    return { data, total };
  }

  async updateEstado(id: string, estado: string) {
    return this.prisma.remision.update({
      where: { id },
      data: { estado },
      select: { id: true, estado: true },
    });
  }

  async findTecnicosByProgramacion(programacionId: string) {
    return this.prisma.remTecnico.findMany({
      where: {
        OR: [
          { programacionId },
          { remision: { programacionId } },
        ],
      },
      select: {
        id: true,
        tecnico:       { select: { nombreCompleto: true } },
        programacion:  { select: { id: true, numProgram: true } },
        remision:      { select: { id: true, numRemision: true } },
        fechaRegistro: true,
        ultimaEdicion: true,
        registradoPor: { select: { nombreCompleto: true } },
        editadoPor:    { select: { nombreCompleto: true } },
      },
      orderBy: { fechaRegistro: 'asc' },
    });
  }

  async findConsumosByProgramacion(programacionId: string) {
    // Mismo orden que las Remisiones (findByProgramacion): por fecha de creación asc
    const remisionesOrden = await this.prisma.remision.findMany({
      where: { programacionId },
      select: { id: true },
      orderBy: { creadoEn: 'asc' },
    });
    const ordenIndex = new Map(remisionesOrden.map((r, i) => [r.id, i]));

    const consumos = await this.prisma.detConsumo.findMany({
      where: { programacionId, eliminar: { not: true } },
      select: {
        id: true,
        cantidad: true,
        valorUnitario: true,
        valor: true,
        remision: { select: { id: true, numRemision: true } },
        producto: { select: { id: true, referencia: true, nombre: true } },
        _count: { select: { valConsumos: { where: { eliminar: { not: true } } } } },
      },
      orderBy: { id: 'asc' },
    });

    const grupos = new Map<string, { remisionId: string | null; numRemision: string | null; items: any[] }>();

    for (const c of consumos) {
      const key = c.remision?.id ?? 'sin-remision';
      if (!grupos.has(key)) {
        grupos.set(key, {
          remisionId: c.remision?.id ?? null,
          numRemision: c.remision?.numRemision ?? null,
          items: [],
        });
      }
      grupos.get(key)!.items.push({
        id: c.id,
        cantidad: Number(c.cantidad ?? 0),
        productoId: c.producto?.id ?? null,
        productoReferencia: c.producto?.referencia ?? null,
        productoNombre: c.producto?.nombre ?? null,
        valorUnitario: Number(c.valorUnitario ?? 0),
        valor: Number(c.valor ?? 0),
        validado: c._count.valConsumos > 0,
      });
    }

    return [...grupos.values()].sort((a, b) => {
      const iA = a.remisionId ? ordenIndex.get(a.remisionId) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
      const iB = b.remisionId ? ordenIndex.get(b.remisionId) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
      return iA - iB;
    });
  }

  async getConsumoDetalle(consumoId: string) {
    const consumo = await this.prisma.detConsumo.findUnique({
      where: { id: consumoId },
      select: {
        id: true,
        referencia: true,
        cantidad: true,
        valorUnitario: true,
        valor: true,
        cantidadUsada: true,
        observaciones: true,
        producto: { select: { id: true, referencia: true, nombre: true } },
        remision: { select: { id: true, numRemision: true } },
        programacion: {
          select: {
            id: true,
            numProgram: true,
            fechaQx: true,
            consumo: true,
            hospitalId: true,
            hospital: { select: { nombre: true } },
            medicos: { select: { medico: { select: { nombreCompleto: true } } } },
          },
        },
      },
    });

    if (!consumo) return null;

    // PRODUCTO VALIDADO = REF_ROWS("ValConsumo", "DESCRIPCIÓN") — ValConsumo cuyo detConsumoId apunta a este consumo
    const validaciones = await this.prisma.valConsumo.findMany({
      where: { detConsumoId: consumoId, eliminar: { not: true } },
      select: {
        id: true,
        numeroOC: true,
        prodRealConsumido: true,
        prodDeTspine: true,
        observacionesAlm: true,
        eliminar: true,
        sedeConsumo: { select: { nombre: true } },
        producto: { select: { id: true, referencia: true, nombre: true } },
        lotes: {
          select: {
            id: true,
            cantidad: true,
            marcaTiempo: true,
            lote:          { select: { lote: true } },
            sede:          { select: { nombre: true } },
            almacen:       { select: { nombre: true } },
            registradoPor: { select: { nombreCompleto: true } },
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    const referencia = consumo.referencia ?? consumo.producto?.referencia ?? null;
    const descripcion = referencia && consumo.producto?.nombre
      ? `${referencia} / ${consumo.producto.nombre}`
      : (consumo.producto?.nombre ?? referencia ?? consumo.producto?.id ?? null);

    const productoValidadoIds = [...new Set(validaciones.map(v => v.producto?.id).filter((id): id is string => !!id))];
    const especialesValidados = await this.getEspecialesPorProducto(productoValidadoIds, consumo.programacion?.hospitalId);

    return {
      id: consumo.id,
      remisionId: consumo.remision?.id ?? null,
      numRemision: consumo.remision?.numRemision ?? null,
      programacionId: consumo.programacion?.id ?? null,
      numProgram: consumo.programacion?.numProgram ?? consumo.programacion?.id ?? null,
      fechaQx: consumo.programacion?.fechaQx ?? null,
      doctor: consumo.programacion?.medicos.map(m => m.medico.nombreCompleto).join(', ') || null,
      hospital: consumo.programacion?.hospital?.nombre ?? null,
      consumo: consumo.programacion?.consumo ?? null,
      referencia,
      descripcion,
      cantidad: Number(consumo.cantidad ?? 0),
      valorUnitario: Number(consumo.valorUnitario ?? 0),
      valor: Number(consumo.valor ?? 0),
      cantidadUsada: Number(consumo.cantidadUsada ?? 0),
      observaciones: consumo.observaciones,
      productoValidado: validaciones.map(v => {
        const especial = v.producto?.id ? especialesValidados.get(v.producto.id) : undefined;
        const referenciaValidada = especial?.referencia ?? v.producto?.referencia ?? null;
        const nombreValidado = especial?.nombre ?? v.producto?.nombre ?? null;
        const productoValidadoDescripcion = referenciaValidada && nombreValidado
          ? `${referenciaValidada} / ${nombreValidado}`
          : (nombreValidado ?? referenciaValidada ?? v.producto?.id ?? null);
        return {
        id: v.id,
        cantRemisionada: Number(consumo.cantidad ?? 0),
        cantRealValidada: v.lotes.reduce((sum, l) => sum + Number(l.cantidad ?? 0), 0),
        referencia,
        referenciaValidada,
        productoValidadoDescripcion,
        numeroOC: v.numeroOC,
        sedeConsumo: v.sedeConsumo?.nombre ?? null,
        prodRealConsumido: v.prodRealConsumido,
        prodDeTspine: v.prodDeTspine,
        observacionesAlm: v.observacionesAlm,
        eliminar: v.eliminar,
        lotes: v.lotes.map(l => ({
          id: l.id,
          valConsumoId: v.id,
          lote: l.lote?.lote ?? null,
          cantidad: Number(l.cantidad ?? 0),
          sede: l.sede?.nombre ?? null,
          ubicacion: l.almacen?.nombre ?? null,
          registradoPor: l.registradoPor?.nombreCompleto ?? null,
          marcaTiempo: l.marcaTiempo,
          producto: productoValidadoDescripcion,
          fecha: l.marcaTiempo ?? null,
        })),
        };
      }),
    };
  }

  /**
   * Nombre/referencia especial que el grupo del hospital de la programación pueda tener para uno o
   * más productos (ver ReferenciaEspecial / NombreProductoEspecial) — mismo mecanismo que
   * CotizacionesService.resolveProductoDisplay, aplicado acá a los productos validados de un
   * ValConsumo, que a diferencia de Det_Consumo no guardan su propia referencia/nombre resuelto y
   * solo tienen productoId, así que hay que resolverlo al leer en vez de al guardar.
   */
  private async getEspecialesPorProducto(productoIds: string[], hospitalId: string | null | undefined) {
    const especiales = new Map<string, { referencia: string | null; nombre: string | null }>();
    if (!hospitalId || productoIds.length === 0) return especiales;

    const hospital = await this.prisma.hospital.findUnique({ where: { id: hospitalId }, select: { terceroId: true } });
    if (!hospital?.terceroId) return especiales;
    const tercero = await this.prisma.tercero.findUnique({ where: { id: hospital.terceroId }, select: { grupoId: true } });
    if (!tercero?.grupoId) return especiales;

    const [refs, nombres] = await this.prisma.$transaction([
      this.prisma.referenciaEspecial.findMany({ where: { grupoId: tercero.grupoId, productoId: { in: productoIds } }, select: { productoId: true, referencia: true } }),
      this.prisma.nombreProductoEspecial.findMany({ where: { grupoId: tercero.grupoId, productoId: { in: productoIds } }, select: { productoId: true, nombreEspecial: true } }),
    ]);
    for (const r of refs) {
      if (!r.productoId) continue;
      especiales.set(r.productoId, { ...(especiales.get(r.productoId) ?? { referencia: null, nombre: null }), referencia: r.referencia });
    }
    for (const n of nombres) {
      if (!n.productoId) continue;
      especiales.set(n.productoId, { ...(especiales.get(n.productoId) ?? { referencia: null, nombre: null }), nombre: n.nombreEspecial });
    }
    return especiales;
  }

  async findValidacionConsumosByProgramacion(programacionId: string) {
    // Mismo orden que las Remisiones (findByProgramacion): por fecha de creación asc
    const [remisionesOrden, programacion] = await Promise.all([
      this.prisma.remision.findMany({
        where: { programacionId },
        select: { id: true },
        orderBy: { creadoEn: 'asc' },
      }),
      this.prisma.programacion.findUnique({ where: { id: programacionId }, select: { hospitalId: true } }),
    ]);
    const ordenIndex = new Map(remisionesOrden.map((r, i) => [r.id, i]));

    const registros = await this.prisma.valConsumo.findMany({
      where: { programacionId, eliminar: { not: true } },
      orderBy: { marcaTiempo: 'asc' },
      select: {
        id: true,
        detConsumoId: true,
        remision: { select: { id: true, numRemision: true } },
        detConsumo: {
          select: {
            cantidad: true,
            valor: true,
            producto: { select: { id: true, referencia: true, nombre: true } },
          },
        },
        producto: { select: { id: true, referencia: true, nombre: true } },
        lotes: { select: { cantidad: true } },
      },
    });

    const productoIds = [...new Set(registros.map(r => r.producto?.id).filter((id): id is string => !!id))];
    const especiales = await this.getEspecialesPorProducto(productoIds, programacion?.hospitalId);

    const grupos = new Map<string, { remisionId: string | null; numRemision: string | null; items: any[] }>();

    for (const r of registros) {
      const key = r.remision?.id ?? 'sin-remision';
      if (!grupos.has(key)) {
        grupos.set(key, {
          remisionId: r.remision?.id ?? null,
          numRemision: r.remision?.numRemision ?? null,
          items: [],
        });
      }
      const cantRealValidada = r.lotes.reduce((sum, l) => sum + Number(l.cantidad ?? 0), 0);
      const especial = r.producto?.id ? especiales.get(r.producto.id) : undefined;
      grupos.get(key)!.items.push({
        id: r.id,
        detConsumoId: r.detConsumoId,
        cantRemisionada: Number(r.detConsumo?.cantidad ?? 0),
        cantRealValidada,
        referenciaRemisionada: r.detConsumo?.producto?.referencia ?? r.detConsumo?.producto?.id ?? null,
        nombreRemisionado: r.detConsumo?.producto?.nombre ?? null,
        referenciaValidada: especial?.referencia ?? r.producto?.referencia ?? null,
        nombreValidado: especial?.nombre ?? r.producto?.nombre ?? null,
        valor: Number(r.detConsumo?.valor ?? 0),
      });
    }

    return [...grupos.values()].sort((a, b) => {
      const iA = a.remisionId ? ordenIndex.get(a.remisionId) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
      const iB = b.remisionId ? ordenIndex.get(b.remisionId) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
      return iA - iB;
    });
  }

  async getValConsumoDetalle(valConsumoId: string) {
    const v = await this.prisma.valConsumo.findUnique({
      where: { id: valConsumoId },
      select: {
        id: true,
        numeroOC: true,
        prodRealConsumido: true,
        prodDeTspine: true,
        observacionesAlm: true,
        eliminar: true,
        sedeConsumo: { select: { nombre: true } },
        producto: { select: { id: true, referencia: true, nombre: true } },
        remision: { select: { id: true, numRemision: true } },
        programacion: {
          select: {
            id: true,
            numProgram: true,
            fechaQx: true,
            hospitalId: true,
            hospital: { select: { nombre: true } },
            medicos: { select: { medico: { select: { nombreCompleto: true } } } },
          },
        },
        detConsumo: {
          select: {
            referencia: true,
            cantidad: true,
            valorUnitario: true,
            valor: true,
            cantidadUsada: true,
            observaciones: true,
            producto: { select: { id: true, referencia: true, nombre: true } },
          },
        },
        lotes: {
          select: {
            id: true,
            cantidad: true,
            marcaTiempo: true,
            lote:          { select: { lote: true } },
            sede:          { select: { nombre: true } },
            almacen:       { select: { nombre: true } },
            registradoPor: { select: { nombreCompleto: true } },
          },
        },
      },
    });

    if (!v) return null;

    const referencia = v.detConsumo?.referencia ?? v.detConsumo?.producto?.referencia ?? null;
    const proRem = referencia && v.detConsumo?.producto?.nombre
      ? `${referencia} / ${v.detConsumo.producto.nombre}`
      : (v.detConsumo?.producto?.nombre ?? referencia ?? v.detConsumo?.producto?.id ?? null);

    const especial = v.producto?.id
      ? (await this.getEspecialesPorProducto([v.producto.id], v.programacion?.hospitalId)).get(v.producto.id)
      : undefined;
    const referenciaValidada = especial?.referencia ?? v.producto?.referencia ?? null;
    const nombreValidado = especial?.nombre ?? v.producto?.nombre ?? null;
    const proVal = referenciaValidada && nombreValidado
      ? `${referenciaValidada} / ${nombreValidado}`
      : (nombreValidado ?? referenciaValidada ?? v.producto?.id ?? null);

    return {
      id: v.id,
      remisionId: v.remision?.id ?? null,
      numRemision: v.remision?.numRemision ?? null,
      numProgram: v.programacion?.numProgram ?? v.programacion?.id ?? null,
      fechaQx: v.programacion?.fechaQx ?? null,
      doctor: v.programacion?.medicos.map(m => m.medico.nombreCompleto).join(', ') || null,
      hospital: v.programacion?.hospital?.nombre ?? null,
      numeroOC: v.numeroOC,
      referencia,
      proRem,
      canRem: Number(v.detConsumo?.cantidad ?? 0),
      valorUnitario: Number(v.detConsumo?.valorUnitario ?? 0),
      valor: Number(v.detConsumo?.valor ?? 0),
      cantUsada: Number(v.detConsumo?.cantidadUsada ?? 0),
      observaciones: v.detConsumo?.observaciones ?? null,
      sedeConsumo: v.sedeConsumo?.nombre ?? null,
      prodRealConsumido: v.prodRealConsumido,
      proVal,
      prodDeTspine: v.prodDeTspine,
      canVal: v.lotes.reduce((sum, l) => sum + Number(l.cantidad ?? 0), 0),
      observacionesAlm: v.observacionesAlm,
      eliminar: v.eliminar,
      lotes: v.lotes.map(l => ({
        id: l.id,
        valConsumoId: v.id,
        lote: l.lote?.lote ?? null,
        cantidad: Number(l.cantidad ?? 0),
        sede: l.sede?.nombre ?? null,
        ubicacion: l.almacen?.nombre ?? null,
        registradoPor: l.registradoPor?.nombreCompleto ?? null,
        marcaTiempo: l.marcaTiempo,
        producto: proVal,
        fecha: l.marcaTiempo,
      })),
    };
  }

  async findAlmacenes(sedeId?: string) {
    return this.prisma.almacen.findMany({
      where: sedeId ? { sedeId } : undefined,
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    });
  }

  /** Validar un consumo (Det_Consumo): crea el registro de validación (ValConsumo). */
  async createValConsumo(detConsumoId: string, dto: CreateValConsumoDto, usuarioId: string) {
    const consumo = await this.prisma.detConsumo.findUnique({
      where: { id: detConsumoId },
      select: { programacionId: true, remisionId: true, productoId: true },
    });
    if (!consumo) throw new NotFoundException('Consumo no encontrado');
    return this.prisma.valConsumo.create({
      data: {
        id: randomUUID(),
        usuarioId,
        marcaTiempo: nowMexico(),
        programacionId: consumo.programacionId,
        remisionId: consumo.remisionId,
        detConsumoId,
        sedeConsumoId: dto.sedeConsumoId,
        prodRealConsumido: dto.prodRealConsumido,
        productoId: dto.prodRealConsumido ? consumo.productoId : dto.productoId,
        prodDeTspine: dto.prodDeTspine,
        observacionesAlm: dto.observacionesAlm,
      },
    });
  }

  async createValConsumoLote(dto: CreateValConsumoLoteDto, usuarioId: string) {
    return this.prisma.valConsumoLote.create({
      data: {
        id: randomUUID(),
        valConsumoId: dto.valConsumoId,
        sedeId: dto.sedeId,
        almacenId: dto.almacenId,
        loteId: dto.loteId,
        cantidad: dto.cantidad,
        registradoPorId: usuarioId,
        marcaTiempo: nowMexico(),
      },
    });
  }

  /** Gasto.TOTAL = VALOR + VALOR SIN IVA + IVA $ − IVA RET $ − ISR RET $ + ISH $ */
  private async computeGastoTotal(gastoId: string): Promise<number> {
    const g = await this.prisma.gasto.findUnique({
      where: { id: gastoId },
      select: { valor: true, valorSinIva: true, ivaId: true, ivaRetId: true, isrRetId: true, ivaManual: true, isrValor: true, porcentaje: true },
    });
    if (!g) return 0;
    const valor = Number(g.valor ?? 0);
    const ivaDolares    = valor * Number(g.ivaId ?? 0) + Number(g.ivaManual ?? 0);
    const ivaRetDolares = valor * Number(g.ivaRetId ?? 0);
    const isrRetDolares = valor * Number(g.isrRetId ?? 0) + Number(g.isrValor ?? 0);
    const ishDolares    = valor * (Number(g.porcentaje ?? 0) / 100);
    return valor + Number(g.valorSinIva ?? 0) + ivaDolares - ivaRetDolares - isrRetDolares + ishDolares;
  }

  /**
   * Compra.TOTAL REAL = SUM(DetalleCompra.TOTAL A PAGAR)
   * DetalleCompra.TOTAL A PAGAR = CANTIDAD × COSTO UNITARIO
   * DetalleCompra.COSTO UNITARIO = COSTOS / CAN RECIBIDA (de las EntradaCompra relacionadas)
   */
  private async computeCompraTotalReal(compraId: string): Promise<number> {
    const detalles = await this.prisma.detalleCompra.findMany({
      where: { compraId },
      select: {
        cantidad: true,
        entradasCompra: { select: { cantidad: true, costo: true } },
      },
    });
    let total = 0;
    for (const d of detalles) {
      const costos = d.entradasCompra.reduce((sum, e) => sum + Number(e.cantidad ?? 0) * Number(e.costo ?? 0), 0);
      const canRecibida = d.entradasCompra.reduce((sum, e) => sum + Number(e.cantidad ?? 0), 0);
      const costoUnitario = canRecibida !== 0 ? costos / canRecibida : 0;
      total += Number(d.cantidad ?? 0) * costoUnitario;
    }
    return total;
  }

  /** Mir.GASTO COMISIÓN = VALOR × COMISION (COMISION guardado como número de %, ej. 8 = 8%) */
  private async computeMirGastoComision(mirId: string): Promise<number> {
    const m = await this.prisma.mir.findUnique({ where: { id: mirId }, select: { valor: true, comision: true } });
    if (!m) return 0;
    return Number(m.valor ?? 0) * (Number(m.comision ?? 0) / 100);
  }

  /** MovimientoCaja.COMISIÓN = VALOR × PORCENTAJE (PORCENTAJE guardado como número de %) */
  private async computeMovimientoCajaComision(movId: string): Promise<number> {
    const mc = await this.prisma.movimientoCaja.findUnique({ where: { id: movId }, select: { valor: true, porcentaje: true } });
    if (!mc) return 0;
    return Number(mc.valor ?? 0) * (Number(mc.porcentaje ?? 0) / 100);
  }

  async getDetTecnicoDetalle(id: string) {
    const dt = await this.prisma.detTecnico.findUnique({
      where: { id },
      select: {
        id: true,
        tipo: true,
        vrComision: true,
        observaciones: true,
        estadoActual: true,
        agregarIva: true,
        quieresDesglosar: true,
        seleccioneTipo: true,
        tecnico: { select: { nombreCompleto: true } },
        remision: { select: { id: true, numRemision: true } },
        detalles: { select: { valor: true, remision: { select: { id: true, numRemision: true } } } },
        programacion: {
          select: {
            id: true,
            numProgram: true,
            fechaQx: true,
            consumo: true,
            hospital: { select: { nombre: true } },
            medicos: { select: { medico: { select: { nombreCompleto: true } } } },
          },
        },
      },
    });

    if (!dt) return null;

    const vrComision = Number(dt.vrComision ?? 0) + dt.detalles.reduce((sum, d) => sum + Number(d.valor ?? 0), 0);

    // PROGRAMACIÓN REALIZADA = REF_ROWS("ProgramacionPagos", "FOLIO COMISIONES")
    // PAGADO (por cada ProgramacionPago) = SUM(PagosEjecución[MONTO] donde EJECUTADO?=TRUE)
    const pagos = await this.prisma.programacionPago.findMany({
      where: { folioComisionesId: id },
      select: {
        id: true,
        provieneDe: true,
        tipoDePago: true,
        folioCompraId: true,
        folioGastoId: true,
        folioMirId: true,
        folioCajaId: true,
        marcaTiempo: true,
        fechaPago: true,
        tipo: true,
        programadoPor: { select: { nombreCompleto: true } },
        beneficiarioGasto: { select: { nombreCompleto: true } },
        beneficiarioPago:  { select: { nombreCompleto: true } },
        pagosEjecucion: {
          select: {
            id: true,
            monto: true,
            ejecutado: true,
            folioRelacionado: true,
            marcaTiempo: true,
            fechaDeRegistro: true,
            fechaProgramado: true,
            fechaDeEjecucionFecha: true,
            saldo: true,
            comprobantePago: true,
            tipoDeComprobante: true,
            fiscal: true,
            ivaPorcentaje: true,
            ivaRetPorcentaje: true,
            registradoPor: { select: { nombreCompleto: true } },
            beneficiarioGasto: { select: { nombreCompleto: true } },
            beneficiarioPago:  { select: { nombreCompleto: true } },
            formaPago: { select: { forma: true } },
            cuenta: {
              select: {
                id: true,
                banco: { select: { nombre: true } },
                tercero: { select: { nombreCompleto: true } },
              },
            },
            origen: { select: { nombre: true } },
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    const pagoMonto = (p: (typeof pagos)[number]) =>
      p.pagosEjecucion.reduce((sum, pe) => sum + (pe.ejecutado ? Number(pe.monto ?? 0) : 0), 0);

    // PROGRAMADO (por cada ProgramacionPago) = SUM(PagosEjecución[MONTO] donde EJECUTADO?=FALSE)
    const pagoProgramado = (p: (typeof pagos)[number]) =>
      p.pagosEjecucion.reduce((sum, pe) => sum + (!pe.ejecutado ? Number(pe.monto ?? 0) : 0), 0);

    const pagado = pagos.reduce((sum, p) => sum + pagoMonto(p), 0);
    const saldo = vrComision - pagado;

    // TOTAL FACTURA = SUB TOTAL + IVA − RETENCION IVA − RETENCION ISR
    const subTotal = dt.agregarIva ? vrComision : vrComision / 1.16;
    const desglosa = dt.quieresDesglosar ?? false;
    const iva           = desglosa ? subTotal * 0.16    : 0;
    const retencionIva  = desglosa ? subTotal * 0.10667 : 0;
    const esActividadEmpresarial = dt.seleccioneTipo?.trim().toUpperCase() === 'ACTIVIDAD EMPRESARIAL';
    const retencionIsr  = desglosa ? (esActividadEmpresarial ? 0 : subTotal * 0.0125) : 0;
    const totalFactura = subTotal + iva - retencionIva - retencionIsr;

    const folio = dt.programacion?.numProgram ?? dt.programacion?.id ?? null;

    // Remisión sobre la que se aplicó la comisión: la propia del registro (Técnicos/Plus), o si es
    // Inversionistas con desglose por producto, las remisiones (sin repetir) de cada línea.
    const remisionesInvolucradas = dt.remision
      ? [dt.remision.numRemision ?? dt.remision.id]
      : [...new Set(dt.detalles.map(d => d.remision?.numRemision ?? d.remision?.id).filter((v): v is string => !!v))];
    const numRemision = remisionesInvolucradas.length > 0 ? remisionesInvolucradas.join(', ') : null;

    // EJECUCIÓN DEL PAGO = REF_ROWS("PagosEjecución", "PROGRAMACIÓN")
    const MESES_ES = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    const ejecucionPagos = pagos.flatMap(p =>
      p.pagosEjecucion.map(pe => {
        const fechaDeRegistro = pe.fechaDeRegistro;
        const mesNum = fechaDeRegistro ? new Date(fechaDeRegistro).getUTCMonth() + 1 : null;
        return {
          id: pe.id,
          folioRelacionado: pe.folioRelacionado,
          registradoPor: pe.registradoPor?.nombreCompleto ?? null,
          fechaYHora: pe.marcaTiempo,
          monto: Number(pe.monto ?? 0),
          ejecutado: pe.ejecutado ?? false,
          programacion: p.id,
          fechaDeRegistro,
          fechaProgramado: pe.fechaProgramado,
          fechaDeEjecucion: pe.fechaDeEjecucionFecha,
          beneficiarioGasto: pe.beneficiarioGasto?.nombreCompleto ?? null,
          beneficiarioPago: pe.beneficiarioPago?.nombreCompleto ?? null,
          formaPago: pe.formaPago?.forma ?? null,
          cuenta: pe.cuenta
            ? [pe.cuenta.id, pe.cuenta.banco?.nombre, pe.cuenta.tercero?.nombreCompleto].filter(Boolean).join(' - ')
            : null,
          origen: pe.origen?.nombre ?? null,
          saldo: pe.saldo !== null && pe.saldo !== undefined ? Number(pe.saldo) : null,
          comprobantePago: pe.comprobantePago,
          tipoDeComprobante: pe.tipoDeComprobante,
          fiscal: pe.fiscal ?? null,
          ivaPorcentaje: pe.ivaPorcentaje !== null && pe.ivaPorcentaje !== undefined ? Number(pe.ivaPorcentaje) : null,
          ivaRetPorcentaje: pe.ivaRetPorcentaje !== null && pe.ivaRetPorcentaje !== undefined ? Number(pe.ivaRetPorcentaje) : null,
          anio: fechaDeRegistro ? new Date(fechaDeRegistro).getUTCFullYear() : null,
          mes: mesNum ? `${mesNum}-. ${MESES_ES[mesNum - 1]}` : null,
        };
      }),
    );

    // MONTO = FOLIO COMPRA.TOTAL REAL + FOLIO GASTO.TOTAL
    //       + IF(¿QUIERES DESGLOSAR?=FALSE, V/R COMIS., TOTAL FACTURA)   (de este mismo DetTecnico)
    //       + FOLIO MIR.GASTO COMISIÓN + FOLIO CAJA.COMISIÓN
    // SALDO (por fila) = MONTO - PAGADO
    // STATUS DE GESTIÓN = SWITCH(...)
    const programacionRealizada = await Promise.all(pagos.map(async p => {
      const [montoCompra, montoGasto, montoMir, montoCaja] = await Promise.all([
        p.folioCompraId ? this.computeCompraTotalReal(p.folioCompraId)    : Promise.resolve(0),
        p.folioGastoId  ? this.computeGastoTotal(p.folioGastoId)          : Promise.resolve(0),
        p.folioMirId    ? this.computeMirGastoComision(p.folioMirId)      : Promise.resolve(0),
        p.folioCajaId   ? this.computeMovimientoCajaComision(p.folioCajaId) : Promise.resolve(0),
      ]);
      const montoComision = desglosa ? totalFactura : vrComision;
      const monto = montoCompra + montoGasto + montoComision + montoMir + montoCaja;

      const pagadoFila = pagoMonto(p);
      const programadoFila = pagoProgramado(p);
      const saldoFila = monto - pagadoFila;

      let statusDeGestion: string;
      if (programadoFila > 0) statusDeGestion = 'PROGRAMADO';
      else if (pagadoFila > 0 && saldoFila > 0) statusDeGestion = 'EN EJECUCIÓN';
      else if (pagadoFila === 0 && saldoFila > 0) statusDeGestion = 'CAPTURADO';
      else statusDeGestion = 'PAGADO';

      return {
        id: p.id,
        folio,
        provieneDe: p.provieneDe,
        tipoDePago: p.tipoDePago,
        beneficiarioGasto: p.beneficiarioGasto?.nombreCompleto ?? null,
        beneficiarioPago: p.beneficiarioPago?.nombreCompleto ?? null,
        pagado: pagadoFila,
        saldo: saldoFila,
        statusDeGestion,
        marcaTiempo: p.marcaTiempo,
        fechaPago: p.fechaPago,
        tipo: p.tipo,
        programadoPor: p.programadoPor?.nombreCompleto ?? null,
      };
    }));

    return {
      id: dt.id,
      nombreContacto: dt.tecnico?.nombreCompleto ?? null,
      numProgram: folio,
      numRemision,
      programacionId: dt.programacion?.id ?? null,
      fechaQx: dt.programacion?.fechaQx ?? null,
      doctor: dt.programacion?.medicos.map(m => m.medico.nombreCompleto).join(', ') || null,
      hospital: dt.programacion?.hospital?.nombre ?? null,
      consumo: dt.programacion?.consumo ?? null,
      tipo: dt.tipo,
      vrComision,
      pagado,
      saldo,
      totalFactura,
      observaciones: dt.observaciones,
      estadoActual: dt.estadoActual,
      programacionRealizada,
      ejecucionPagos,
    };
  }

  async findComisionesByProgramacion(programacionId: string) {
    const registros = await this.prisma.detTecnico.findMany({
      where: {
        OR: [
          { programacionId },
          { remision: { programacionId } },
        ],
      },
      select: {
        id: true,
        categoria: true,
        tipo: true,
        vrComision: true,
        tecnicoId: true,
        tecnico: { select: { nombreCompleto: true } },
        remision: { select: { id: true, numRemision: true } },
        detalles: {
          select: {
            valor: true,
            remision: { select: { id: true, numRemision: true } },
            producto: { select: { nombre: true, referencia: true } },
          },
        },
      },
      // Del más antiguo al más reciente — si a un mismo técnico/inversionista se le asignó más de
      // una comisión, sus líneas quedan en el mismo orden en que se agregaron (ver loop de abajo).
      orderBy: { marcaTiempo: 'asc' },
    });

    type DetalleLinea = { comisionId: string; tipo: string | null; remisionLabel: string | null; productoLabel: string | null; valor: number };
    type ItemTecnico = { id: string; tecnico: string | null; monto: number; detalle: DetalleLinea[] };
    const grupos = new Map<string, { categoria: string; items: Map<string, ItemTecnico> }>();

    for (const r of registros) {
      const cat = r.categoria?.trim() || 'Sin categoría';
      if (!grupos.has(cat)) grupos.set(cat, { categoria: cat, items: new Map() });
      const itemsPorTecnico = grupos.get(cat)!.items;

      // Varias "Agregar Comisión" para el mismo técnico/inversionista dentro de la misma categoría
      // se fusionan en un solo renglón (mismo monto sumado) — el detalle por remisión/producto se
      // conserva aparte para no perder esa trazabilidad al fusionar.
      const tecnicoKey = r.tecnicoId ?? r.id;
      if (!itemsPorTecnico.has(tecnicoKey)) {
        itemsPorTecnico.set(tecnicoKey, { id: r.id, tecnico: r.tecnico?.nombreCompleto ?? null, monto: 0, detalle: [] });
      }
      const item = itemsPorTecnico.get(tecnicoKey)!;

      if (r.detalles.length > 0) {
        for (const d of r.detalles) {
          const valor = Number(d.valor ?? 0);
          item.monto += valor;
          item.detalle.push({
            comisionId: r.id,
            tipo: r.tipo,
            remisionLabel: d.remision?.numRemision ?? d.remision?.id ?? null,
            productoLabel: d.producto?.nombre ?? d.producto?.referencia ?? null,
            valor,
          });
        }
      } else {
        const valor = Number(r.vrComision ?? 0);
        item.monto += valor;
        item.detalle.push({
          comisionId: r.id,
          tipo: r.tipo,
          remisionLabel: r.remision?.numRemision ?? r.remision?.id ?? null,
          productoLabel: null,
          valor,
        });
      }
    }

    return [...grupos.values()].map(g => ({ categoria: g.categoria, items: [...g.items.values()] }));
  }

  private static readonly MESES_ES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  private static readonly REQUISICION_SELECT = {
    id: true,
    marcaDeTiempo: true,
    status: true,
    fecha: true,
    provieneDeProgramacion: true,
    validacion: true,
    existeProgramacion: true,
    cubrimientoId: true,
    tarifaId: true,
    contactoId: true,
    usuario: { select: { nombreCompleto: true } },
    programacion: { select: { numProgram: true, id: true } },
    cubrimiento: { select: { nombre: true } },
    tarifa: { select: { nombre: true } },
    contacto: { select: { nombreCompleto: true } },
    sedeOrigen: { select: { nombre: true } },
  } as const;

  private mapRequisicion(r: {
    id: string;
    marcaDeTiempo: Date | null;
    status: string | null;
    fecha: Date | null;
    provieneDeProgramacion: boolean | null;
    validacion: string | null;
    existeProgramacion: boolean | null;
    cubrimientoId: string | null;
    tarifaId: string | null;
    contactoId: string | null;
    usuario: { nombreCompleto: string } | null;
    programacion: { numProgram: string | null; id: string } | null;
    cubrimiento: { nombre: string } | null;
    tarifa: { nombre: string } | null;
    contacto: { nombreCompleto: string } | null;
    sedeOrigen: { nombre: string } | null;
  }) {
    const mesNum = r.fecha ? new Date(r.fecha).getUTCMonth() + 1 : null;
    return {
      id: r.id,
      marcaDeTiempo: r.marcaDeTiempo,
      status: r.status,
      fecha: r.fecha,
      provieneDeProgramacion: r.provieneDeProgramacion,
      folio: r.programacion?.numProgram ?? r.programacion?.id ?? null,
      validacion: r.validacion,
      existeProgramacion: r.existeProgramacion,
      cubrimientoId: r.cubrimientoId,
      tarifaId: r.tarifaId,
      contactoId: r.contactoId,
      usuario: r.usuario?.nombreCompleto ?? null,
      cubrimiento: r.cubrimiento?.nombre ?? null,
      tarifa: r.tarifa?.nombre ?? null,
      contacto: r.contacto?.nombreCompleto ?? null,
      sedeOrigen: r.sedeOrigen?.nombre ?? null,
      anio: r.fecha ? new Date(r.fecha).getUTCFullYear() : null,
      mes: mesNum ? `${mesNum}-. ${RemisionesRepositoryService.MESES_ES[mesNum - 1]}` : null,
    };
  }

  // Para autocompletar el campo Tarifa al editar una requisición: si el Tercero del contacto
  // (hospital) tiene tarifa propia asignada, se usa esa. Mismo patrón que
  // CotizacionesService.getTerceroTarifa.
  async getTerceroTarifa(terceroId: string) {
    const tercero = await this.prisma.tercero.findUnique({
      where: { id: terceroId },
      select: {
        tarifaId: true,
        tarifa: { select: { nombre: true } },
      },
    });
    return {
      tarifaId: tercero?.tarifaId ?? null,
      tarifaNombre: tercero?.tarifa?.nombre ?? null,
    };
  }

  async countRequisicionesByProgramacion(programacionId: string): Promise<number> {
    return this.prisma.requisicion.count({ where: { programacionId } });
  }

  async findRequisicionesByProgramacion(programacionId: string) {
    const requisiciones = await this.prisma.requisicion.findMany({
      where: { programacionId },
      select: RemisionesRepositoryService.REQUISICION_SELECT,
      orderBy: { marcaDeTiempo: 'asc' },
    });

    return requisiciones.map(r => this.mapRequisicion(r));
  }

  async getRequisicionDetalle(id: string) {
    const r = await this.prisma.requisicion.findUnique({
      where: { id },
      select: RemisionesRepositoryService.REQUISICION_SELECT,
    });

    if (!r) return null;

    return this.mapRequisicion(r);
  }

  async updateRequisicion(id: string, dto: { fecha?: string; cubrimientoId?: string; tarifaId?: string }) {
    const data: any = {};
    if (dto.fecha !== undefined) data.fecha = new Date(dto.fecha);
    if (dto.cubrimientoId !== undefined) data.cubrimientoId = dto.cubrimientoId;
    if (dto.tarifaId !== undefined) data.tarifaId = dto.tarifaId;

    const updated = await this.prisma.$transaction(async tx => {
      const req = await tx.requisicion.update({
        where: { id },
        data,
        select: RemisionesRepositoryService.REQUISICION_SELECT,
      });

      // La tarifa asociada de cada insumo se copia de la requisición al crearse — si la
      // tarifa de la requisición cambia, hay que propagarla a los insumos ya existentes.
      if (dto.tarifaId !== undefined) {
        await tx.detRequisicion.updateMany({
          where: { requisicionId: id },
          data: { tarifaAsociadaId: dto.tarifaId },
        });
      }

      return req;
    });

    return this.mapRequisicion(updated);
  }

  async deleteRequisicion(id: string) {
    return this.prisma.requisicion.delete({ where: { id } });
  }

  async findCubrimientos() {
    const tarifas = await this.prisma.tarifa.findMany({
      select: { id: true, nombre: true, tipoCubrimientoId: true },
      orderBy: { orden: 'asc' },
    });
    return tarifas
      .filter(t => t.tipoCubrimientoId === t.id)
      .map(({ id, nombre }) => ({ id, nombre }));
  }

  async findTarifasByCubrimiento(cubrimientoId: string) {
    return this.prisma.tarifa.findMany({
      where: { tipoCubrimientoId: cubrimientoId },
      select: { id: true, nombre: true },
      orderBy: { orden: 'asc' },
    });
  }

  /** Formato: REQ_(número de la programación, sin el prefijo PRO_)_0000001 — consecutivo por programación */
  private async generateRequisicionId(programacionId: string): Promise<string> {
    const numProgramacion = programacionId.replace(/^PRO_/, '');
    const prefix = `REQ_${numProgramacion}_`;
    const last = await this.prisma.requisicion.findFirst({
      where: { id: { startsWith: prefix } },
      orderBy: { id: 'desc' },
      select: { id: true },
    });
    if (!last) return `${prefix}0000001`;
    const num = Number.parseInt(last.id.replace(prefix, ''), 10);
    return `${prefix}${String(Number.isNaN(num) ? 1 : num + 1).padStart(7, '0')}`;
  }

  async createRequisicion(dto: CreateRequisicionDto, usuarioId: string) {
    // El ID de cada insumo es un hex aleatorio de 4 bytes (espacio ~4 mil millones), así que
    // generarlos en paralelo en vez de uno por uno (round-trip a la BD por cada insumo) es seguro:
    // la probabilidad de colisión entre sí dentro del mismo lote es despreciable.
    const [programacion, id, insumoIds] = await Promise.all([
      this.prisma.programacion.findUnique({
        where: { id: dto.programacionId },
        select: { sedeId: true, hospital: { select: { terceroId: true } } },
      }),
      this.generateRequisicionId(dto.programacionId),
      Promise.all((dto.insumos ?? []).map(() => this.generateDetRequisicionId())),
    ]);

    return this.prisma.$transaction(async tx => {
      const requisicion = await tx.requisicion.create({
        data: {
          id,
          marcaDeTiempo: nowMexico(),
          usuarioId,
          fecha: new Date(dto.fecha),
          status: 'Borrador',
          programacionId: dto.programacionId,
          provieneDeProgramacion: true,
          existeProgramacion: true,
          cubrimientoId: dto.cubrimientoId,
          tarifaId: dto.tarifaId,
          contactoId: programacion?.hospital?.terceroId ?? null,
          sedeOrigenId: programacion?.sedeId ?? null,
        },
      });

      if (dto.insumos?.length) {
        await tx.detRequisicion.createMany({
          data: dto.insumos.map((insumo, i) => ({
            id: insumoIds[i],
            requisicionId: requisicion.id,
            loteId: insumo.loteId,
            productoId: insumo.productoId,
            cantidad: insumo.cantidad,
            precio: insumo.precio,
            tarifaAsociadaId: dto.tarifaId,
          })),
        });
      }

      return requisicion;
    });
  }

  /** Formato: REM_(número de la programación, sin el prefijo PRO_)_0000001 — consecutivo por programación */
  private async generateRemisionId(programacionId: string): Promise<string> {
    const numProgramacion = programacionId.replace(/^PRO_/, '');
    const prefix = `REM_${numProgramacion}_`;
    const last = await this.prisma.remision.findFirst({
      where: { id: { startsWith: prefix } },
      orderBy: { id: 'desc' },
      select: { id: true },
    });
    if (!last) return `${prefix}0000001`;
    const num = Number.parseInt(last.id.replace(prefix, ''), 10);
    return `${prefix}${String(Number.isNaN(num) ? 1 : num + 1).padStart(7, '0')}`;
  }

  async createRemision(dto: CreateRemisionDto, usuarioId: string) {
    const id = await this.generateRemisionId(dto.programacionId);
    // dto.firma llega como data URL en base64 (ver SignaturePad en el frontend) — hay que guardarla
    // como archivo en uploads/firmas/ y persistir esa ruta relativa, igual que ya hace
    // createDocumentoProgramacion con los PDFs. Antes se guardaba el base64 crudo directo en la
    // columna `firma`, así que uploadFileExists() (usado para armar firmaDisponible en getById)
    // siempre daba false — la firma nunca se podía volver a mostrar aunque sí se hubiera dibujado.
    const extension = extensionFromMime(mimeFromDataUrl(dto.firma));
    const rutaFirma = saveUploadFile('firmas', `${id}.${extension}`, decodeBase64DataUrl(dto.firma));
    return this.prisma.remision.create({
      data: {
        id,
        numRemision: id,
        usuarioId,
        creadoEn: nowMexico(),
        programacionId: dto.programacionId,
        tarifaId: dto.tarifaId,
        paciente: dto.paciente,
        cirugiaRealizada: dto.cirugiaRealizada,
        impuestos: dto.impuestos,
        cubrimientoId: dto.cubrimientoId,
        empresaId: dto.empresaId,
        responsableEconomicoId: dto.responsableEconomicoId,
        anestesiologo: dto.anestesiologo,
        tieneDcto: dto.tieneDcto ?? false,
        porcentajeDcto: dto.porcentajeDcto,
        vrDctoPesos: dto.vrDctoPesos,
        firma: rutaFirma,
        estado: 'Tramitada',
        status: true,
      },
    });
  }

  /**
   * Consumos (Det_Consumo) agregados de una sola vez a una remisión — usado tanto al crearla
   * (donde el estado siempre es Tramitada y no tiene factura) como al importarlos por paquete/
   * cotizaciones desde Editar Remisión, por eso valida estado y factura igual que addDetConsumo.
   */
  async createDetConsumosBulk(remisionId: string, items: { productoId: string; cantidad: number; valorUnitario: number; observaciones?: string }[]) {
    const remision = await this.prisma.remision.findUnique({ where: { id: remisionId }, select: { estado: true, programacionId: true } });
    if (!remision) throw new NotFoundException('Remisión no encontrada');
    if (remision.estado !== 'Tramitada' && remision.estado !== 'Descorche') {
      throw new BadRequestException('Solo se pueden editar consumos de remisiones en estado Tramitada o Descorche');
    }
    const facturasCount = await this.prisma.factura.count({ where: { remisionId } });
    if (facturasCount > 0) throw new BadRequestException('No se pueden editar los consumos de una remisión que ya tiene factura asociada');
    return this.prisma.detConsumo.createMany({
      data: items.map(it => ({
        id: randomUUID(),
        remisionId,
        programacionId: remision.programacionId,
        productoId: it.productoId,
        cantidad: it.cantidad,
        valorUnitario: it.valorUnitario,
        valor: it.cantidad * it.valorUnitario,
        observaciones: it.observaciones,
      })),
    });
  }

  /**
   * Técnicos asociados (Rem_Tecnicos) agregados de una sola vez a una remisión — usado tanto al
   * crearla (estado siempre Tramitada) como al agregar varios desde Editar Remisión, por eso
   * valida estado igual que addRemTecnico.
   */
  async createRemTecnicosBulk(remisionId: string, tecnicoIds: string[], usuarioId: string) {
    const remision = await this.prisma.remision.findUnique({ where: { id: remisionId }, select: { estado: true, programacionId: true } });
    if (!remision) throw new NotFoundException('Remisión no encontrada');
    if (remision.estado !== 'Tramitada' && remision.estado !== 'Descorche') {
      throw new BadRequestException('Solo se pueden editar técnicos de remisiones en estado Tramitada o Descorche');
    }
    const now = nowMexico();
    return this.prisma.remTecnico.createMany({
      data: tecnicoIds.map(tecnicoId => ({
        id: randomUUID(),
        remisionId,
        programacionId: remision.programacionId,
        tecnicoId,
        registradoPorId: usuarioId,
        fechaRegistro: now,
      })),
    });
  }

  async findDetallesByRequisicion(requisicionId: string) {
    const detalles = await this.prisma.detRequisicion.findMany({
      where: { requisicionId },
      select: {
        id: true,
        loteId: true,
        productoId: true,
        cantidad: true,
        precio: true,
        requisicion: { select: { fecha: true } },
        lote: { select: { lote: true } },
        producto: {
          select: {
            nombre: true,
            referencia: true,
            sistema: { select: { sistema: true } },
            categoria: { select: { categoria: true } },
          },
        },
        tarifaAsociada: { select: { nombre: true } },
      },
    });

    return detalles.map(d => ({
      id: d.id,
      loteId: d.loteId,
      productoId: d.productoId,
      cantidad: d.cantidad,
      precio: d.precio,
      fecha: d.requisicion?.fecha ?? null,
      lote: d.lote?.lote ?? null,
      producto: d.producto?.nombre ?? null,
      referencia: d.producto?.referencia ?? null,
      descripcion: d.producto?.nombre ?? null,
      sistema: d.producto?.sistema?.sistema ?? null,
      categoria: d.producto?.categoria?.categoria ?? null,
      tarifaAsociada: d.tarifaAsociada?.nombre ?? null,
    }));
  }

  async updateDetRequisicion(id: string, dto: { loteId?: string; productoId?: string; cantidad?: number; precio?: number }) {
    const data: any = {};
    if (dto.loteId !== undefined) data.loteId = dto.loteId;
    if (dto.productoId !== undefined) data.productoId = dto.productoId;
    if (dto.cantidad !== undefined) data.cantidad = dto.cantidad;
    if (dto.precio !== undefined) data.precio = dto.precio;

    return this.prisma.detRequisicion.update({ where: { id }, data });
  }

  async deleteDetRequisicion(id: string) {
    await this.prisma.detRequisicion.delete({ where: { id } });
  }

  async searchLotes(search?: string) {
    const searchTerm = search?.trim();
    // SQL crudo (no where/contains de Prisma) por lo mismo que searchProductos: se necesita
    // unaccent() para que "Solucion" también encuentre "Solución" — Prisma no tiene equivalente.
    const searchFilter = searchTerm
      ? Prisma.sql`AND unaccent(l.lote) ILIKE unaccent(${'%' + searchTerm + '%'})`
      : Prisma.empty;

    return this.prisma.$queryRaw<{ id: string; lote: string | null }[]>`
      SELECT l.id_lote AS id, l.lote
      FROM lotes l
      WHERE 1=1
      ${searchFilter}
      ORDER BY l.lote ASC
      LIMIT 20
    `;
  }

  // Misma funcionalidad que CotizacionesService.searchProductos (búsqueda sin acentos por
  // nombre/referencia/sistema, límite alto en modo "ver todas" sin término, exclusión de
  // denegados por tarifa); a diferencia de ahí, por defecto no se restringe por categoría (una
  // requisición puede pedir cualquier tipo de producto, no solo lo "cotizable") y no se resuelven
  // nombres/referencias especiales por hospital — soloCotizables=true activa ese mismo filtro de
  // categoría para los llamadores que sí lo necesitan (ej. "Pro Val" al validar un consumo).
  async searchProductos(search?: string, tarifaId?: string, soloCotizables?: boolean) {
    const searchTerm = search?.trim();

    const searchFilter = searchTerm
      ? Prisma.sql`AND (
          unaccent(p.nombre) ILIKE unaccent(${'%' + searchTerm + '%'})
          OR unaccent(p.referencia) ILIKE unaccent(${'%' + searchTerm + '%'})
          OR unaccent(s.sistema) ILIKE unaccent(${'%' + searchTerm + '%'})
        )`
      : Prisma.empty;
    const tarifaFilter = tarifaId
      ? Prisma.sql`AND NOT EXISTS (
          SELECT 1 FROM producto_tarifas_denegadas ptd
          WHERE ptd.producto_id = p.id_producto AND ptd.tarifa_id = ${tarifaId}
        )`
      : Prisma.empty;
    const categoriaFilter = soloCotizables
      ? Prisma.sql`AND p.categoria_id IN (${Prisma.join(CATEGORIAS_COTIZABLES)})`
      : Prisma.empty;

    const productosRaw = await this.prisma.$queryRaw<{
      id: string;
      nombre: string | null;
      referencia: string | null;
      sistema: string | null;
      categoria: string | null;
      particulares: Prisma.Decimal | null;
      hospitales: Prisma.Decimal | null;
      distribuidor: Prisma.Decimal | null;
      aseguradora: Prisma.Decimal | null;
    }[]>`
      SELECT p.id_producto AS id, p.nombre, p.referencia, s.sistema, p.categoria_id AS categoria,
             p.particulares, p.hospitales, p.distribuidor, p.aseguradora
      FROM productos p
      LEFT JOIN sistemas s ON s.id_producto = p.sistema_id
      WHERE 1=1
      ${searchFilter}
      ${tarifaFilter}
      ${categoriaFilter}
      ORDER BY p.nombre ASC
      -- A diferencia de Cotizaciones (200 sin término, acotado a 5 categorías "cotizables"), acá
      -- no hay filtro de categoría — un límite tan alto mostraría demasiada variedad de una,
      -- así que se deja un tope fijo más chico, con o sin término de búsqueda.
      LIMIT 30
    `;

    // Precio específico de la tarifa (ListaPrecio, mismo mecanismo que ya usa Cotizaciones) —
    // aparte de las 4 columnas genéricas por categoría de cubrimiento, que se quedan como
    // respaldo en el frontend para cuando un producto no tiene precio cargado para esta tarifa
    // puntual.
    let precioPorProducto = new Map<string, number | null>();
    if (tarifaId && productosRaw.length > 0) {
      const listasPrecio = await this.prisma.listaPrecio.findMany({
        where: { subtarifaId: tarifaId, productoId: { in: productosRaw.map(p => p.id) } },
        select: { productoId: true, precio: true },
      });
      precioPorProducto = new Map(listasPrecio.filter(lp => lp.productoId !== null).map(lp => [lp.productoId as string, lp.precio !== null ? Number(lp.precio) : null]));
    }

    return productosRaw.map(p => ({
      id: p.id,
      nombre: p.nombre,
      referencia: p.referencia,
      particulares: p.particulares !== null ? Number(p.particulares) : null,
      hospitales: p.hospitales !== null ? Number(p.hospitales) : null,
      distribuidor: p.distribuidor !== null ? Number(p.distribuidor) : null,
      aseguradora: p.aseguradora !== null ? Number(p.aseguradora) : null,
      sistema: p.sistema ?? null,
      categoria: p.categoria ?? null,
      precioSugerido: precioPorProducto.get(p.id) ?? null,
    }));
  }

  private async generateDetRequisicionId(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const id = randomBytes(4).toString('hex');
      const exists = await this.prisma.detRequisicion.findUnique({ where: { id }, select: { id: true } });
      if (!exists) return id;
    }
    throw new Error('No se pudo generar un ID único para el insumo');
  }

  async createDetRequisicion(dto: CreateDetRequisicionDto) {
    let tarifaAsociadaId = dto.tarifaAsociadaId;
    if (tarifaAsociadaId === undefined) {
      const requisicion = await this.prisma.requisicion.findUnique({
        where: { id: dto.requisicionId },
        select: { tarifaId: true },
      });
      tarifaAsociadaId = requisicion?.tarifaId ?? undefined;
    }

    const id = await this.generateDetRequisicionId();
    return this.prisma.detRequisicion.create({
      data: {
        id,
        requisicionId: dto.requisicionId,
        loteId: dto.loteId,
        productoId: dto.productoId,
        cantidad: dto.cantidad,
        precio: dto.precio,
        tarifaAsociadaId: tarifaAsociadaId ?? null,
      },
    });
  }

  async findDocumentosByProgramacion(programacionId: string) {
    const documentos = await this.prisma.documentoProgramacion.findMany({
      where: { programacionId },
      select: {
        id: true,
        nombre: true,
        documento: true,
        cargadoEl: true,
        cargadoPor: { select: { nombreCompleto: true } },
        programacion: { select: { id: true, numProgram: true } },
      },
      orderBy: { cargadoEl: 'asc' },
    });
    return documentos.map(d => ({ ...d, archivoDisponible: uploadFileExists(d.documento) }));
  }

  async createDocumentoProgramacion(dto: CreateDocumentoProgramacionDto, usuarioId: string) {
    const contents = decodeBase64DataUrl(dto.documento);
    const MAX_DOCUMENTO_BYTES = 8 * 1024 * 1024;
    if (contents.length > MAX_DOCUMENTO_BYTES) {
      throw new BadRequestException('El archivo es demasiado grande (máximo 8MB).');
    }

    const id = randomUUID();
    const rutaRelativa = saveUploadFile('documentos-programacion', `${id}.pdf`, contents);

    const documento = await this.prisma.documentoProgramacion.create({
      data: {
        id,
        programacionId: dto.programacionId,
        nombre: dto.nombre,
        documento: rutaRelativa,
        cargadoEl: nowMexico(),
        cargadoPorId: usuarioId,
      },
    });
    return { ...documento, archivoDisponible: true };
  }

  async getDocumentoProgramacionArchivo(id: string) {
    const documento = await this.prisma.documentoProgramacion.findUnique({
      where: { id },
      select: { nombre: true, documento: true },
    });
    if (!documento?.documento || !uploadFileExists(documento.documento)) {
      throw new NotFoundException('Documento no disponible');
    }
    return { path: resolveUploadPath(documento.documento), nombre: documento.nombre ?? 'documento' };
  }

  async getRemisionFirmaArchivo(id: string) {
    const remision = await this.prisma.remision.findUnique({
      where: { id },
      select: { firma: true },
    });
    if (!remision?.firma || !uploadFileExists(remision.firma)) {
      throw new NotFoundException('Firma no disponible');
    }
    return { path: resolveUploadPath(remision.firma), mime: mimeFromExtension(remision.firma) };
  }

  async findGastosByProgramacion(programacionId: string) {
    return this.prisma.gasto.findMany({
      where: { fuenteId: programacionId },
      select: {
        id: true,
        numGasto: true,
        fechaGasto: true,
        descripcion: true,
        valor: true,
        beneficiarioGasto: { select: { nombreCompleto: true } },
        tipoGasto: { select: { descripcion: true } },
      },
      orderBy: { fechaGasto: 'asc' },
    });
  }

  async findFuentesByProgramacion(programacionId: string) {
    return this.prisma.fuente.findMany({
      where: { programacionId },
      select: {
        id: true,
        marcaTiempo: true,
        monto: true,
        gasto: { select: { id: true, numGasto: true, descripcion: true } },
        registradoPor: { select: { nombreCompleto: true } },
        programacion: { select: { id: true, numProgram: true } },
      },
      orderBy: { marcaTiempo: 'asc' },
    });
  }

  async findNotasCreditoByProgramacion(programacionId: string) {
    return this.prisma.notaCredito.findMany({
      where: { factura: { remision: { programacionId } } },
      select: {
        id: true,
        marcaTiempo: true,
        fechaRemision: true,
        fechaNotaCredito: true,
        total: true,
        formaDescuento: true,
        valor: true,
        porcentaje: true,
        notas: true,
        valorNc: true,
        aplicadaPor: { select: { nombreCompleto: true } },
        factura: {
          select: {
            id: true,
            remision: {
              select: {
                id: true,
                numRemision: true,
                programacion: { select: { id: true, numProgram: true } },
              },
            },
          },
        },
      },
      orderBy: { fechaNotaCredito: 'asc' },
    });
  }

  async getById(remisionId: string) {
    const remision = await this.prisma.remision.findUnique({
      where: { id: remisionId },
      select: {
        id: true,
        numRemision: true,
        estado: true,
        cxc: true,
        paciente: true,
        cirugiaRealizada: true,
        anestesiologo: true,
        creadoEn: true,
        porcentajeDcto: true,
        vrDctoPesos: true,
        tieneDcto: true,
        vrFactura: true,
        diferencia: true,
        impuestos: true,
        tieneFactura: true,
        estadoFactura: true,
        noFactura: true,
        numFactura: true,
        fechaFacturacion: true,
        facturadoPor: true,
        tieneCotizacion: true,
        cotizacion: true,
        firma: true,
        status: true,
        usuario:              { select: { id: true, nombreCompleto: true } },
        tarifa:               { select: { id: true, nombre: true } },
        cubrimiento:          { select: { id: true, nombre: true } },
        responsableEconomico: { select: { id: true, nombreCompleto: true } },
        cliente:              { select: { nombreCompleto: true } },
        empresa:              {
          select: {
            id: true,
            nombreCompleto: true,
            datosFiscales: {
              select: { rfc: true, razonSocial: true, celular: true, oficina: true, correo: true },
            },
          },
        },
        programacion: {
          select: {
            id: true,
            numProgram: true,
            fechaQx: true,
            horaQx: true,
            consumo: true,
            observaciones: true,
            sede:     { select: { nombre: true } },
            hospital: {
              select: {
                nombre: true,
                ciudadCat: { select: { nombre: true } },
                tercero: { select: { id: true, nombreCompleto: true } },
              },
            },
            medicos:  { select: { medico: { select: { nombreCompleto: true } } } },
            detConsumos: { select: { _count: { select: { valConsumos: true } } } },
          },
        },
        detConsumos: {
          where: { eliminar: { not: true } },
          select: {
            id: true,
            cantidad: true,
            valorUnitario: true,
            valor: true,
            producto: { select: { id: true, referencia: true, nombre: true } },
          },
          orderBy: { id: 'asc' },
        },
        remTecnicos: {
          select: {
            id: true,
            tecnico:       { select: { nombreCompleto: true } },
            programacion:  { select: { id: true, numProgram: true } },
            remision:      { select: { id: true, numRemision: true } },
            fechaRegistro: true,
            ultimaEdicion: true,
            registradoPor: { select: { nombreCompleto: true } },
            editadoPor:    { select: { nombreCompleto: true } },
          },
          orderBy: { fechaRegistro: 'asc' },
        },
      },
    });

    if (!remision) return null;

    const { detConsumos, remTecnicos, ...rest } = remision;

    const subtotal   = detConsumos.reduce((sum, d) => sum + Number(d.valor ?? 0), 0);
    const descuentos = subtotal * (Number(rest.porcentajeDcto ?? 0) / 100) + Number(rest.vrDctoPesos ?? 0);

    // Las siguientes tres consultas solo dependen de remisionId (no una de otra) — antes se
    // esperaban en secuencia, una tras otra; ahora corren en paralelo.
    const [detTecnicosComision, detallesFactura, facturasRelacionadas] = await Promise.all([
      // BONOS Y COMISIONES = Det_Tecnicos de esta remisión, agrupados por categoría
      this.prisma.detTecnico.findMany({
        where: { remisionId },
        select: {
          id: true,
          categoria: true,
          vrComision: true,
          tecnico: { select: { nombreCompleto: true } },
          detalles: { select: { valor: true } },
        },
        orderBy: { id: 'asc' },
      }),
      // FACTURADO = SUM(DetalleFactura[SubTotal]) donde Productoid coincide y la factura pertenece a esta remisión
      // SubTotal (columna virtual en AppSheet) = Cantidad * Preciounitario - Descuento
      // El campo V/R FACTURA de Remisión viene vacío en el CSV (es una columna virtual no exportada),
      // así que el TOTAL por factura se recalcula aquí: SUM(SubTotal * (1 + tasa IVA)) por factura.
      this.prisma.detalleFactura.findMany({
        where: { facturacion: { remisionId } },
        select: { facturacionId: true, productoId: true, cantidad: true, precioUnitario: true, descuento: true, ivaId: true },
      }),
      // FACTURACIÓN = REF_ROWS("Facturacion", "Remision") — todas las facturas ligadas a esta remisión
      this.prisma.factura.findMany({
        where: { remisionId },
        select: {
          id: true,
          folioFacturacion: true,
          fechaCreacion: true,
          generadaPor: { select: { nombreCompleto: true } },
          cliente: { select: { nombreCompleto: true } },
        },
        orderBy: { fechaCreacion: 'asc' },
      }),
    ]);

    const bonosComisionesGrupos = new Map<string, { categoria: string; items: { id: string; tecnico: string | null; monto: number }[] }>();
    for (const r of detTecnicosComision) {
      const cat = r.categoria?.trim() || 'Sin categoría';
      if (!bonosComisionesGrupos.has(cat)) bonosComisionesGrupos.set(cat, { categoria: cat, items: [] });
      const montoDesglose = r.detalles.reduce((sum, d) => sum + Number(d.valor ?? 0), 0);
      bonosComisionesGrupos.get(cat)!.items.push({
        id: r.id,
        tecnico: r.tecnico?.nombreCompleto ?? null,
        monto: Number(r.vrComision ?? 0) + montoDesglose,
      });
    }
    const bonosComisiones = [...bonosComisionesGrupos.values()];

    const facturadoPorProducto = new Map<string, number>();
    const totalPorFactura = new Map<string, number>();
    for (const df of detallesFactura) {
      const subTotal = Number(df.cantidad ?? 0) * Number(df.precioUnitario ?? 0) - Number(df.descuento ?? 0);
      if (df.productoId) {
        facturadoPorProducto.set(df.productoId, (facturadoPorProducto.get(df.productoId) ?? 0) + subTotal);
      }
      if (df.facturacionId) {
        const ivaRate = Number(df.ivaId ?? 0);
        const totalLinea = subTotal * (1 + ivaRate);
        totalPorFactura.set(df.facturacionId, (totalPorFactura.get(df.facturacionId) ?? 0) + totalLinea);
      }
    }

    const facturas = facturasRelacionadas.map(f => ({
      id: f.id,
      folioFacturacion: f.folioFacturacion,
      fechaCreacion: f.fechaCreacion,
      generadaPor: f.generadaPor?.nombreCompleto ?? null,
      cliente: f.cliente?.nombreCompleto ?? null,
      total: totalPorFactura.get(f.id) ?? 0,
    }));

    // TOTAL ANTES IMP. = SubTotal - V/r Dcto
    // IVA        = IF(Impuestos IN ("I.V.A.","Todos"), Total Antes Imp. * 0.16,     0)
    // RETENCION  = IF(Impuestos IN ("Retención","Todos"), Total Antes Imp. * 0.106667, 0)
    // TOTAL (PAGAR) = Total Antes Imp. + IVA - RETENCION
    const round2 = (n: number) => Math.round(n * 100) / 100;
    const totalAntesImp = round2(subtotal - descuentos);
    const normImpuestos = (rest.impuestos ?? '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const iva       = round2((normImpuestos === 'i.v.a.' || normImpuestos === 'todos') ? totalAntesImp * 0.16 : 0);
    const retencion = round2((normImpuestos === 'retencion' || normImpuestos === 'todos') ? totalAntesImp * 0.106667 : 0);
    const total     = round2(totalAntesImp + iva - retencion);

    // SALDO (fórmula original en AppSheet) = TOTAL PAGAR - SUM(NotaCreditos.Valor NC) - SUM(Facturacions.PAGADO)
    // PAGADO (por Factura) = SUM(Related Abonos[VALOR])
    //
    // NOTA: en NotaCredito, el campo "REMISION" en realidad apunta a Factura (confirmado en BD),
    // y "REMISION NO" (el Ref real hacia Remisión) es una columna VIRTUAL calculada por fórmula
    // ([REMISION].[Remision]), no un Ref físico. AppSheet no genera listas "Related X" automáticas
    // a partir de columnas Ref virtuales, así que [Related NotaCreditos] en la fórmula de SALDO de
    // Remisiones evalúa siempre a una lista vacía en el sistema viejo — esa resta nunca funcionó ahí.
    // Replicamos ese comportamiento (legado) a propósito, dejando comentada la versión "correcta".
    const facturaIds = facturasRelacionadas.map(f => f.id);
    const abonosFacturas = facturaIds.length
      ? await this.prisma.abono.findMany({ where: { facturaId: { in: facturaIds } }, select: { valor: true } })
      : [];
    const sumPagadoFacturas = abonosFacturas.reduce((sum, a) => sum + Number(a.valor ?? 0), 0);
    const saldo = round2(total - sumPagadoFacturas);
    // Versión matemáticamente "correcta" (si el Ref de NotaCredito→Remisión funcionara en AppSheet):
    // const notasCreditoFacturas = facturaIds.length
    //   ? await this.prisma.notaCredito.findMany({ where: { facturaId: { in: facturaIds } }, select: { valorNc: true } })
    //   : [];
    // const sumNotasCredito = notasCreditoFacturas.reduce((sum, nc) => sum + Number(nc.valorNc ?? 0), 0);
    // const saldo = round2(total - sumNotasCredito - sumPagadoFacturas);

    return {
      ...rest,
      firmaDisponible: uploadFileExists(rest.firma),
      programacion: rest.programacion
        ? { ...rest.programacion, consumoNoValidado: computeConsumoNoValidado(rest.programacion) }
        : null,
      subtotal,
      descuentos,
      totalAntesImp,
      iva,
      retencion,
      total,
      saldo,
      consumos: detConsumos.map(d => {
        const valor     = Number(d.valor ?? 0);
        const facturado = d.producto?.id ? (facturadoPorProducto.get(d.producto.id) ?? 0) : 0;
        return {
          id: d.id,
          cantidad: Number(d.cantidad ?? 0),
          productoId: d.producto?.id ?? null,
          productoReferencia: d.producto?.referencia ?? null,
          productoNombre: d.producto?.nombre ?? null,
          valorUnitario: Number(d.valorUnitario ?? 0),
          valor,
          facturado,
          porFacturar: valor - facturado,
        };
      }),
      tecnicos: remTecnicos.map(t => ({
        id: t.id,
        tecnico: t.tecnico,
        programacion: t.programacion,
        remision: t.remision,
        fechaRegistro: t.fechaRegistro,
        ultimaEdicion: t.ultimaEdicion,
        registradoPor: t.registradoPor,
        editadoPor: t.editadoPor,
      })),
      bonosComisiones,
      facturas,
      puedeConvertirFactura: detConsumos.some(d => {
        const valor = Number(d.valor ?? 0);
        const facturado = d.producto?.id ? (facturadoPorProducto.get(d.producto.id) ?? 0) : 0;
        return (valor - facturado) > 0;
      }),
    };
  }

  /**
   * Replica el grupo de acciones "Convertir en Factura" de AppSheet:
   * 1) "Convertir en Factura 2" — crea la Factura con los datos generales de la remisión.
   * 2) "EnviarItems" → "Enviar a Facturar" — por cada Det_Consumo con saldo pendiente
   *    (mismo cálculo de FACTURADO/POR FACTURAR que getById), crea su línea en DetalleFactura.
   * 3) "EnviadoaCxC" — marca la remisión como enviada a Cuentas por Cobrar (cxc = true).
   */
  async convertirEnFactura(remisionId: string, usuarioId: string) {
    const [remision, detConsumos, detallesFacturaExistentes] = await Promise.all([
      this.prisma.remision.findUnique({
        where: { id: remisionId },
        select: {
          id: true,
          paciente: true,
          vrDctoPesos: true,
          programacion: {
            select: {
              sedeId: true,
              fechaQx: true,
              hospital: { select: { nombre: true } },
              medicos: { select: { medico: { select: { nombreCompleto: true } } } },
            },
          },
        },
      }),
      this.prisma.detConsumo.findMany({
        where: { remisionId, eliminar: { not: true } },
        select: {
          cantidad: true,
          valorUnitario: true,
          valor: true,
          producto: { select: { id: true, nombre: true, codigoSat: true, udemId: true, objetoImpuestoId: true } },
        },
      }),
      this.prisma.detalleFactura.findMany({
        where: { facturacion: { remisionId } },
        select: { productoId: true, cantidad: true, precioUnitario: true, descuento: true },
      }),
    ]);
    if (!remision) throw new NotFoundException('Remisión no encontrada');
    const facturadoPorProducto = new Map<string, number>();
    for (const df of detallesFacturaExistentes) {
      if (!df.productoId) continue;
      const subTotal = Number(df.cantidad ?? 0) * Number(df.precioUnitario ?? 0) - Number(df.descuento ?? 0);
      facturadoPorProducto.set(df.productoId, (facturadoPorProducto.get(df.productoId) ?? 0) + subTotal);
    }

    const consumosPorFacturar = detConsumos.filter(d => {
      const valor = Number(d.valor ?? 0);
      const facturado = d.producto?.id ? (facturadoPorProducto.get(d.producto.id) ?? 0) : 0;
      return (valor - facturado) > 0;
    });

    if (consumosPorFacturar.length === 0) {
      throw new BadRequestException('No hay consumos pendientes por facturar en esta remisión');
    }

    const doctor = remision.programacion?.medicos.map(m => m.medico.nombreCompleto).join(', ') || null;

    return this.prisma.$transaction(async tx => {
      const factura = await tx.factura.create({
        data: {
          id: randomUUID(),
          marcaDeTiempo: nowMexico(),
          fechaCreacion: nowMexico(),
          generadaPorId: usuarioId,
          remisionId: remision.id,
          doctor,
          hospital: remision.programacion?.hospital?.nombre ?? null,
          paciente: remision.paciente,
          fechaCirugia: remision.programacion?.fechaQx ?? null,
          // El "[NC]" de la fórmula original de AppSheet (Descuento Global = [V/R DCTO]+[NC])
          // sumaba un Ref virtual roto que siempre evaluaba vacío — mismo caso ya documentado
          // arriba en getById() para el cálculo de SALDO. Se replica ese comportamiento (legado)
          // a propósito: no se suma ningún NC real, solo el descuento manual de la remisión.
          descuentoGlobal: remision.vrDctoPesos ?? 0,
          sedeId: remision.programacion?.sedeId ?? null,
        },
      });

      await tx.detalleFactura.createMany({
        data: consumosPorFacturar.map(d => ({
          id: randomUUID(),
          facturacionId: factura.id,
          productoId: d.producto?.id ?? null,
          descripcion: d.producto?.nombre ?? null,
          cantidad: d.cantidad,
          precioUnitario: d.valorUnitario,
          ivaId: '0.16',
          codigoSat: d.producto?.codigoSat ?? null,
          unidadMedidaId: d.producto?.udemId ?? null,
          objetoImpuestoId: d.producto?.objetoImpuestoId ?? null,
        })),
      });

      await tx.remision.update({ where: { id: remisionId }, data: { cxc: true } });

      return factura;
    });
  }

  /** Solo se pueden editar remisiones en estado Tramitada o Descorche. */
  async updateRemision(id: string, dto: UpdateRemisionDto) {
    const current = await this.prisma.remision.findUnique({ where: { id }, select: { estado: true } });
    if (!current) throw new NotFoundException('Remisión no encontrada');
    if (current.estado !== 'Tramitada' && current.estado !== 'Descorche') {
      throw new BadRequestException('Solo se pueden editar remisiones en estado Tramitada o Descorche');
    }
    return this.prisma.remision.update({
      where: { id },
      data: {
        usuarioId: dto.usuarioId,
        paciente: dto.paciente,
        cirugiaRealizada: dto.cirugiaRealizada,
        cubrimientoId: dto.cubrimientoId,
        tarifaId: dto.tarifaId,
        empresaId: dto.empresaId,
        responsableEconomicoId: dto.responsableEconomicoId,
        anestesiologo: dto.anestesiologo,
        impuestos: dto.impuestos,
        tieneDcto: dto.tieneDcto,
        porcentajeDcto: dto.porcentajeDcto,
        vrDctoPesos: dto.vrDctoPesos,
      },
    });
  }

  /** Agregar un técnico a una remisión ya existente — misma restricción de estado que updateRemision. */
  async addRemTecnico(remisionId: string, tecnicoId: string, usuarioId: string) {
    const remision = await this.prisma.remision.findUnique({ where: { id: remisionId }, select: { estado: true, programacionId: true } });
    if (!remision) throw new NotFoundException('Remisión no encontrada');
    if (remision.estado !== 'Tramitada' && remision.estado !== 'Descorche') {
      throw new BadRequestException('Solo se pueden editar técnicos de remisiones en estado Tramitada o Descorche');
    }
    return this.prisma.remTecnico.create({
      data: {
        id: randomUUID(),
        remisionId,
        programacionId: remision.programacionId,
        tecnicoId,
        registradoPorId: usuarioId,
        fechaRegistro: nowMexico(),
      },
    });
  }

  /**
   * Quitar un técnico asociado a una remisión ya existente — misma restricción de estado que
   * updateRemision, más bloqueo si es el último técnico (una remisión no puede quedar sin
   * ninguno asignado).
   */
  async removeRemTecnico(relId: string) {
    const relacion = await this.prisma.remTecnico.findUnique({ where: { id: relId }, select: { remisionId: true, remision: { select: { estado: true } } } });
    if (!relacion) throw new NotFoundException('Técnico asociado no encontrado');
    if (relacion.remision?.estado !== 'Tramitada' && relacion.remision?.estado !== 'Descorche') {
      throw new BadRequestException('Solo se pueden editar técnicos de remisiones en estado Tramitada o Descorche');
    }
    if (relacion.remisionId) {
      const count = await this.prisma.remTecnico.count({ where: { remisionId: relacion.remisionId } });
      if (count <= 1) throw new BadRequestException('Debe haber al menos un técnico asociado a la remisión');
    }
    await this.prisma.remTecnico.delete({ where: { id: relId } });
  }

  /**
   * Agregar un consumo a una remisión ya existente — misma restricción de estado que
   * updateRemision, más bloqueo si la remisión ya tiene factura (rompería el cálculo de
   * facturado/por facturar, que se basa en los Det_Consumo vigentes).
   */
  async addDetConsumo(remisionId: string, dto: { productoId: string; cantidad: number; valorUnitario: number; observaciones?: string }) {
    const remision = await this.prisma.remision.findUnique({ where: { id: remisionId }, select: { estado: true, programacionId: true } });
    if (!remision) throw new NotFoundException('Remisión no encontrada');
    if (remision.estado !== 'Tramitada' && remision.estado !== 'Descorche') {
      throw new BadRequestException('Solo se pueden editar consumos de remisiones en estado Tramitada o Descorche');
    }
    const facturasCount = await this.prisma.factura.count({ where: { remisionId } });
    if (facturasCount > 0) throw new BadRequestException('No se pueden editar los consumos de una remisión que ya tiene factura asociada');
    return this.prisma.detConsumo.create({
      data: {
        id: randomUUID(),
        remisionId,
        programacionId: remision.programacionId,
        productoId: dto.productoId,
        cantidad: dto.cantidad,
        valorUnitario: dto.valorUnitario,
        valor: dto.cantidad * dto.valorUnitario,
        observaciones: dto.observaciones,
      },
    });
  }

  /** Editar un consumo de una remisión ya existente — mismas restricciones que addDetConsumo. */
  async updateDetConsumo(consumoId: string, dto: { cantidad?: number; valorUnitario?: number; observaciones?: string }) {
    const consumo = await this.prisma.detConsumo.findUnique({
      where: { id: consumoId },
      select: { remisionId: true, cantidad: true, valorUnitario: true, remision: { select: { estado: true } } },
    });
    if (!consumo) throw new NotFoundException('Consumo no encontrado');
    if (consumo.remision?.estado !== 'Tramitada' && consumo.remision?.estado !== 'Descorche') {
      throw new BadRequestException('Solo se pueden editar consumos de remisiones en estado Tramitada o Descorche');
    }
    if (consumo.remisionId) {
      const facturasCount = await this.prisma.factura.count({ where: { remisionId: consumo.remisionId } });
      if (facturasCount > 0) throw new BadRequestException('No se pueden editar los consumos de una remisión que ya tiene factura asociada');
    }
    const cantidad = dto.cantidad ?? Number(consumo.cantidad ?? 0);
    const valorUnitario = dto.valorUnitario ?? Number(consumo.valorUnitario ?? 0);
    return this.prisma.detConsumo.update({
      where: { id: consumoId },
      data: {
        cantidad: dto.cantidad,
        valorUnitario: dto.valorUnitario,
        valor: cantidad * valorUnitario,
        observaciones: dto.observaciones,
      },
    });
  }

  /**
   * Eliminar un consumo de una remisión ya existente — mismas restricciones que addDetConsumo,
   * más bloqueo si es el último consumo (una remisión no puede quedar sin ninguno).
   */
  async removeDetConsumo(consumoId: string) {
    const consumo = await this.prisma.detConsumo.findUnique({
      where: { id: consumoId },
      select: { remisionId: true, remision: { select: { estado: true } } },
    });
    if (!consumo) throw new NotFoundException('Consumo no encontrado');
    if (consumo.remision?.estado !== 'Tramitada' && consumo.remision?.estado !== 'Descorche') {
      throw new BadRequestException('Solo se pueden editar consumos de remisiones en estado Tramitada o Descorche');
    }
    if (consumo.remisionId) {
      const facturasCount = await this.prisma.factura.count({ where: { remisionId: consumo.remisionId } });
      if (facturasCount > 0) throw new BadRequestException('No se pueden editar los consumos de una remisión que ya tiene factura asociada');
      const count = await this.prisma.detConsumo.count({ where: { remisionId: consumo.remisionId } });
      if (count <= 1) throw new BadRequestException('Debe haber al menos un consumo en la remisión');
    }
    await this.prisma.detConsumo.delete({ where: { id: consumoId } });
  }

  /**
   * Solo se puede eliminar una remisión en estado Tramitada/Descorche, sin factura, y sin
   * consumos/técnicos/comisiones asociados (misma restricción de estado que updateRemision).
   * Nota: las FK hacia "remisiones" (det_consumos, rem_tecnicos, det_tecnicos, val_consumo, etc.)
   * están configuradas con ON DELETE SET NULL, no CASCADE ni RESTRICT — Postgres no bloquearía
   * el borrado aunque haya datos relacionados, por eso estas reglas se validan aquí en código.
   */
  async deleteRemision(id: string) {
    const current = await this.prisma.remision.findUnique({ where: { id }, select: { estado: true } });
    if (!current) throw new NotFoundException('Remisión no encontrada');
    if (current.estado !== 'Tramitada' && current.estado !== 'Descorche') {
      throw new BadRequestException('Solo se pueden eliminar remisiones en estado Tramitada o Descorche');
    }
    const [facturasCount, consumosCount, tecnicosCount, comisionesCount] = await Promise.all([
      this.prisma.factura.count({ where: { remisionId: id } }),
      this.prisma.detConsumo.count({ where: { remisionId: id } }),
      this.prisma.remTecnico.count({ where: { remisionId: id } }),
      this.prisma.detTecnico.count({ where: { remisionId: id } }),
    ]);
    const bloqueos: string[] = [];
    if (facturasCount > 0) bloqueos.push('ya tiene factura asociada');
    if (consumosCount > 0) bloqueos.push('tiene consumos asociados');
    if (tecnicosCount > 0) bloqueos.push('tiene técnicos asignados');
    if (comisionesCount > 0) bloqueos.push('tiene comisiones asociadas');
    if (bloqueos.length > 0) {
      throw new BadRequestException(`No se puede eliminar: ${bloqueos.join(', ')}`);
    }
    await this.prisma.remision.delete({ where: { id } });
  }

  async findByProgramacion(programacionId: string) {
    const remisiones = await this.prisma.remision.findMany({
      where: { programacionId },
      select: {
        id: true,
        numRemision: true,
        estado: true,
        cxc: true,
        paciente: true,
        cirugiaRealizada: true,
        porcentajeDcto: true,
        vrDctoPesos: true,
        impuestos: true,
        tieneFactura: true,
        noFactura: true,
        estadoFactura: true,
        creadoEn: true,
        tarifa: { select: { nombre: true } },
        detConsumos: {
          where: { eliminar: { not: true } },
          select: { valor: true },
        },
      },
      orderBy: { creadoEn: 'asc' },
    });

    // Mismo cálculo que getById (SubTotal → Total Antes Imp. → IVA/Retención → Total) — antes esta
    // lista solo exponía el subtotal crudo de consumos, sin descuento ni impuestos aplicados, lo que
    // no coincidía con el "Total" que sí se muestra en el detalle de la remisión.
    const round2 = (n: number) => Math.round(n * 100) / 100;
    return remisiones.map(({ detConsumos, impuestos, ...r }) => {
      const subtotal = detConsumos.reduce((sum, d) => sum + Number(d.valor ?? 0), 0);
      const descuentos = subtotal * (Number(r.porcentajeDcto ?? 0) / 100) + Number(r.vrDctoPesos ?? 0);
      const totalAntesImp = round2(subtotal - descuentos);
      const normImpuestos = (impuestos ?? '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      const iva = round2((normImpuestos === 'i.v.a.' || normImpuestos === 'todos') ? totalAntesImp * 0.16 : 0);
      const retencion = round2((normImpuestos === 'retencion' || normImpuestos === 'todos') ? totalAntesImp * 0.106667 : 0);
      return {
        ...r,
        subtotal,
        total: round2(totalAntesImp + iva - retencion),
      };
    });
  }
}
