import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@app/prisma/prisma.service';
import { nowMexico } from '@app/commons/date.utils';
import { CotizacionQueryDto } from './dto/cotizacion-query.dto';
import { CreateDetCotizaDto } from './dto/create-det-cotiza.dto';
import { UpdateDetCotizaDto } from './dto/update-det-cotiza.dto';
import { UpdateCotizacionDto } from './dto/update-cotizacion.dto';
import { CreateCotizacionDto } from './dto/create-cotizacion.dto';

// Solo estas categorías de producto son cotizables — el resto (Instrumental, Equipo, Tapa,
// Utilería, etc.) no debe aparecer al buscar el campo Producto de un consumo.
const CATEGORIAS_COTIZABLES = ['Renta', 'Implante', 'Consumible', 'Biológico', 'Refrigerados'];

const COTIZACION_LIST_SELECT = {
  id: true,
  numCotizacion: true,
  fecha: true,
  medico: true,
  cirugia: true,
  status: true,
  tieneDcto: true,
  porcentajeDcto: true,
  vrDctoPesos: true,
  impuestos: true,
  usuario:  { select: { nombreCompleto: true, correo: true } },
  hospital: { select: { nombreCompleto: true } },
  empresa:  { select: { nombreCompleto: true } },
  sede:     { select: { nombre: true } },
} as const;

// Misma fórmula que computeTotalesFromSubtotal en el frontend (CotizacionesPage.tsx) — se
// duplica acá porque el listado necesita el total ya calculado por fila, y no vale la pena traer
// los ítems completos de cada cotización solo para eso (ver el agregado por groupBy en findAll).
function computeTotalCotizacion(subtotal: number, tieneDcto: boolean, porcentajeDcto: number | null, vrDctoPesos: number | null, impuestos: string | null): number {
  const vrDcto = tieneDcto ? (subtotal * (Number(porcentajeDcto) || 0) / 100) + (Number(vrDctoPesos) || 0) : 0;
  const totalAntesImpuestos = subtotal - vrDcto;
  const iva = (impuestos === 'Iva' || impuestos === 'Todos') ? totalAntesImpuestos * 0.16 : 0;
  const retencion = (impuestos === 'Retención' || impuestos === 'Todos') ? totalAntesImpuestos * 0.106667 : 0;
  return totalAntesImpuestos + iva - retencion;
}

// El "deber ser" es mostrar el nombre completo del usuario que creó la cotización — pero algunos
// Terceros migrados de AppSheet tienen nombre_completo vacío. En ese caso se cae al identificador
// con el que esa persona entra a la app (la parte antes de "@" en su correo, ver EMAIL_DOMAIN en
// auth), en vez de dejar el campo Usuario en blanco.
function resolveNombreUsuario(usuario: { nombreCompleto: string; correo: string | null } | null): string | null {
  if (!usuario) return null;
  const nombre = usuario.nombreCompleto?.trim();
  if (nombre) return nombre;
  return usuario.correo?.split('@')[0] || null;
}

@Injectable()
export class CotizacionesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: CotizacionQueryDto) {
    const { page = 1, limit = 300, search, dateFrom, dateTo } = query;
    const skip = (page - 1) * limit;

    // "Eliminar" una cotización solo la desactiva (soft-delete) — el listado nunca debe mostrar
    // las inactivas, aunque el registro se conserve en la base de datos.
    const where: any = { activo: true };

    if (dateFrom || dateTo) {
      where.fecha = {};
      if (dateFrom) where.fecha.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.fecha.lte = end;
      }
    }

    if (search?.trim()) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { numCotizacion: { contains: search, mode: 'insensitive' } },
        { medico: { contains: search, mode: 'insensitive' } },
        { cirugia: { contains: search, mode: 'insensitive' } },
        { usuario:  { nombreCompleto: { contains: search, mode: 'insensitive' } } },
        { hospital: { nombreCompleto: { contains: search, mode: 'insensitive' } } },
        { empresa:  { nombreCompleto: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.cotizacion.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fecha: 'desc' },
        select: COTIZACION_LIST_SELECT,
      }),
      this.prisma.cotizacion.count({ where }),
    ]);

    // Un solo agregado para el subtotal (suma de valor) de todas las cotizaciones de esta página,
    // en vez de traer los ítems completos de cada una solo para sumarlos en JS.
    const subtotales = data.length > 0
      ? await this.prisma.detCotiza.groupBy({
          by: ['cotizacionId'],
          where: { cotizacionId: { in: data.map(c => c.id) } },
          _sum: { valor: true },
        })
      : [];
    const subtotalPorCotizacion = new Map(subtotales.map(s => [s.cotizacionId, Number(s._sum.valor ?? 0)]));

    const items = data.map(c => ({
      id: c.id,
      numCotizacion: c.numCotizacion,
      fecha: c.fecha,
      medico: c.medico,
      cirugia: c.cirugia,
      status: c.status,
      usuario: resolveNombreUsuario(c.usuario),
      hospital: c.hospital?.nombreCompleto ?? null,
      empresa: c.empresa?.nombreCompleto ?? null,
      sede: c.sede?.nombre ?? null,
      total: computeTotalCotizacion(subtotalPorCotizacion.get(c.id) ?? 0, c.tieneDcto, c.porcentajeDcto ? Number(c.porcentajeDcto) : null, c.vrDctoPesos ? Number(c.vrDctoPesos) : null, c.impuestos),
    }));

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string) {
    const c = await this.prisma.cotizacion.findUnique({
      where: { id },
      select: {
        ...COTIZACION_LIST_SELECT,
        marcaDeTiempo: true,
        dirigidoA: true,
        hospitalId: true,
        cubrimientoId: true,
        cubrimiento: { select: { nombre: true } },
        responsableEconomicoId: true,
        responsableEconomico: { select: { nombreCompleto: true } },
        numProveedor: true,
        tarifaId: true,
        tarifa: { select: { nombre: true } },
        tiempoEntrega: true,
        observaciones: true,
        tieneDcto: true,
        porcentajeDcto: true,
        vrDcto: true,
        vrDctoPesos: true,
        impuestos: true,
        nota: true,
        imagen: true,
        empresaId: true,
        sedeId: true,
        paqueteId: true,
        paquete: { select: { nombre: true } },
        contadorPaquetes: true,
        nivel: true,
      },
    });
    if (!c) return null;

    const [detalles, remisiones] = await this.prisma.$transaction([
      this.prisma.detCotiza.findMany({
        where: { cotizacionId: id },
        orderBy: { marcaDeTiempo: 'asc' },
        select: {
          id: true,
          referencia: true,
          cantidad: true,
          valorUnitario: true,
          valor: true,
          observaciones: true,
          productoId: true,
          hospital: { select: { nombreCompleto: true } },
          producto: { select: { nombre: true, sistema: { select: { sistema: true } } } },
        },
      }),
      this.prisma.remision.findMany({
        where: { cotizacion: id },
        select: { id: true, numRemision: true, estado: true },
      }),
    ]);

    return {
      id: c.id,
      numCotizacion: c.numCotizacion,
      marcaDeTiempo: c.marcaDeTiempo,
      fecha: c.fecha,
      dirigidoA: c.dirigidoA,
      medico: c.medico,
      cirugia: c.cirugia,
      status: c.status,
      usuario: resolveNombreUsuario(c.usuario),
      hospitalId: c.hospitalId,
      hospital: c.hospital?.nombreCompleto ?? null,
      empresaId: c.empresaId,
      empresa: c.empresa?.nombreCompleto ?? null,
      sedeId: c.sedeId,
      sede: c.sede?.nombre ?? null,
      cubrimientoId: c.cubrimientoId,
      cubrimiento: c.cubrimiento?.nombre ?? null,
      responsableEconomicoId: c.responsableEconomicoId,
      responsableEconomico: c.responsableEconomico?.nombreCompleto ?? null,
      numProveedor: c.numProveedor,
      tarifaId: c.tarifaId,
      tarifa: c.tarifa?.nombre ?? null,
      tiempoEntrega: c.tiempoEntrega,
      observaciones: c.observaciones,
      tieneDcto: c.tieneDcto,
      porcentajeDcto: c.porcentajeDcto,
      vrDcto: c.vrDcto,
      vrDctoPesos: c.vrDctoPesos,
      impuestos: c.impuestos,
      nota: c.nota,
      imagen: c.imagen,
      paqueteId: c.paqueteId,
      paquete: c.paquete?.nombre ?? null,
      contadorPaquetes: c.contadorPaquetes,
      nivel: c.nivel,
      items: detalles.map(d => ({
        id: d.id,
        productoId: d.productoId,
        referencia: d.referencia,
        descripcion: d.producto?.nombre ?? null,
        sistema: d.producto?.sistema?.sistema ?? null,
        hospital: d.hospital?.nombreCompleto ?? null,
        cantidad: d.cantidad,
        valorUnitario: d.valorUnitario,
        valor: d.valor,
        observaciones: d.observaciones,
      })),
      remisionesAsociadas: remisiones.map(r => ({ id: r.id, numRemision: r.numRemision, estado: r.estado })),
    };
  }

  async createCotizacion(dto: CreateCotizacionDto, usuarioId?: string) {
    const id = await this.generateCotizacionId();
    await this.prisma.cotizacion.create({
      data: {
        id,
        numCotizacion: id,
        usuarioId,
        marcaDeTiempo: nowMexico(),
        fecha: new Date(dto.fecha),
        dirigidoA: dto.dirigidoA,
        medico: dto.medico,
        hospitalId: dto.hospitalId,
        cirugia: dto.cirugia,
        cubrimientoId: dto.cubrimientoId,
        empresaId: dto.empresaId,
        responsableEconomicoId: dto.responsableEconomicoId,
        sedeId: dto.sedeId,
        numProveedor: dto.numProveedor,
        tarifaId: dto.tarifaId ?? dto.cubrimientoId,
        tiempoEntrega: dto.tiempoEntrega,
        observaciones: dto.observaciones,
        paqueteId: dto.paqueteId || null,
        nivel: dto.nivel || null,
        tieneDcto: dto.tieneDcto ?? false,
        porcentajeDcto: dto.porcentajeDcto,
        vrDctoPesos: dto.vrDctoPesos,
        impuestos: dto.impuestos,
        status: 'Pendiente',
      },
    });
    return this.getById(id);
  }

  async updateCotizacion(id: string, dto: UpdateCotizacionDto) {
    const existing = await this.prisma.cotizacion.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Cotización no encontrada');

    const data: any = {};
    if (dto.fecha !== undefined) data.fecha = new Date(dto.fecha);
    if (dto.dirigidoA !== undefined) data.dirigidoA = dto.dirigidoA;
    if (dto.medico !== undefined) data.medico = dto.medico;
    if (dto.hospitalId !== undefined) data.hospitalId = dto.hospitalId || null;
    if (dto.cirugia !== undefined) data.cirugia = dto.cirugia;
    if (dto.cubrimientoId !== undefined) data.cubrimientoId = dto.cubrimientoId || null;
    if (dto.empresaId !== undefined) data.empresaId = dto.empresaId || null;
    if (dto.responsableEconomicoId !== undefined) data.responsableEconomicoId = dto.responsableEconomicoId || null;
    if (dto.sedeId !== undefined) data.sedeId = dto.sedeId || null;
    if (dto.numProveedor !== undefined) data.numProveedor = dto.numProveedor;
    if (dto.tarifaId !== undefined) data.tarifaId = dto.tarifaId || null;
    if (dto.tiempoEntrega !== undefined) data.tiempoEntrega = dto.tiempoEntrega;
    if (dto.observaciones !== undefined) data.observaciones = dto.observaciones;
    if (dto.paqueteId !== undefined) data.paqueteId = dto.paqueteId || null;
    if (dto.nivel !== undefined) data.nivel = dto.nivel || null;
    if (dto.tieneDcto !== undefined) data.tieneDcto = dto.tieneDcto;
    if (dto.porcentajeDcto !== undefined) data.porcentajeDcto = dto.porcentajeDcto;
    if (dto.vrDcto !== undefined) data.vrDcto = dto.vrDcto;
    if (dto.vrDctoPesos !== undefined) data.vrDctoPesos = dto.vrDctoPesos;
    if (dto.impuestos !== undefined) data.impuestos = dto.impuestos;

    await this.prisma.cotizacion.update({ where: { id }, data });
    return this.getById(id);
  }

  async deleteCotizacion(id: string) {
    // Soft-delete: se conserva el registro (y sus detalles/remisiones asociadas), solo se marca
    // como inactivo para que deje de aparecer en el listado.
    await this.prisma.cotizacion.update({ where: { id }, data: { activo: false } });
    return { success: true };
  }

  async searchTerceros(search?: string, clasificacion?: string) {
    const searchTerm = search?.trim();
    // Prisma no soporta un equivalente a unaccent() con el query builder normal — se usa SQL
    // crudo para que "Garcia" también encuentre "García" (antes solo hacía match exacto de acentos).
    const searchFilter = searchTerm
      ? Prisma.sql`AND unaccent(t.nombre_completo) ILIKE unaccent(${'%' + searchTerm + '%'})`
      : Prisma.empty;
    const clasificacionFilter = clasificacion
      ? Prisma.sql`AND EXISTS (SELECT 1 FROM tercero_clasificaciones tc WHERE tc.tercero_id = t.id AND tc.clasificacion = ${clasificacion}::"ClasificacionTercero")`
      : Prisma.empty;
    // Sin término de búsqueda es el modo "ver todas las opciones" (ej. abrir el campo Médico sin
    // escribir) — se necesita un límite más alto para que realmente se vean todas, no solo 20.
    const limit = searchTerm ? 20 : 200;

    return this.prisma.$queryRaw<{ id: string; nombreCompleto: string }[]>`
      SELECT t.id, t.nombre_completo AS "nombreCompleto"
      FROM terceros t
      WHERE true
      ${searchFilter}
      ${clasificacionFilter}
      ORDER BY t.nombre_completo ASC
      LIMIT ${limit}
    `;
  }

  // Para autocompletar el campo Tarifa: si el Tercero (hospital/responsable económico) tiene
  // tarifa propia asignada (Tercero.tarifaId) se usa esa; si no, el formulario cae de vuelta al
  // cubrimiento general (mismo id que Tarifa.id de nivel superior, ver dto.tarifaId ?? dto.cubrimientoId
  // en createCotizacion).
  async getTerceroTarifa(terceroId: string) {
    const tercero = await this.prisma.tercero.findUnique({
      where: { id: terceroId },
      select: {
        tarifaId: true,
        tarifa: { select: { nombre: true } },
        sedeId: true,
        sede: { select: { nombre: true } },
      },
    });
    return {
      tarifaId: tercero?.tarifaId ?? null,
      tarifaNombre: tercero?.tarifa?.nombre ?? null,
      sedeId: tercero?.sedeId ?? null,
      sedeNombre: tercero?.sede?.nombre ?? null,
    };
  }

  async getTarifas() {
    return this.prisma.tarifa.findMany({
      select: { id: true, nombre: true },
      orderBy: { orden: 'asc' },
    });
  }

  async getSedes() {
    return this.prisma.sede.findMany({
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async getPaquetes() {
    return this.prisma.paqueteCotizacion.findMany({
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    });
  }

  // Consumos (productos + cantidad) definidos para un paquete según el nivel elegido (1 a 6, cada
  // uno es una columna propia en detalle_paquetes). Solo se devuelven los productos cuya cantidad
  // para ese nivel es mayor a 0 — un producto puede no aplicar en niveles bajos. El precio sugerido
  // sale de la lista de precios de la tarifa, igual que en searchProductos.
  async getPaqueteConsumos(paqueteId: string, nivel: string, tarifaId?: string) {
    const match = nivel?.match(/(\d+)/);
    const n = match ? Number(match[1]) : NaN;
    if (!n || n < 1 || n > 6) {
      throw new BadRequestException('Nivel inválido, debe ser "Nivel 1" a "Nivel 6"');
    }
    const nivelField = `nivel${n}` as 'nivel1' | 'nivel2' | 'nivel3' | 'nivel4' | 'nivel5' | 'nivel6';

    const detalles = await this.prisma.detallePaquete.findMany({
      where: { paqueteId },
      select: {
        productoId: true,
        nivel1: true,
        nivel2: true,
        nivel3: true,
        nivel4: true,
        nivel5: true,
        nivel6: true,
        producto: { select: { nombre: true, referencia: true, sistema: { select: { sistema: true } } } },
      },
    });

    const conCantidad = detalles
      .filter(d => d.productoId && (d[nivelField] ?? 0) > 0)
      .map(d => ({
        id: d.productoId as string,
        nombre: d.producto?.nombre ?? null,
        referencia: d.producto?.referencia ?? null,
        sistema: d.producto?.sistema?.sistema ?? null,
        cantidad: d[nivelField] as number,
      }));

    if (conCantidad.length === 0) return [];

    if (!tarifaId) {
      return conCantidad.map(p => ({ ...p, precioSugerido: null as number | null }));
    }

    const listasPrecio = await this.prisma.listaPrecio.findMany({
      where: { subtarifaId: tarifaId, productoId: { in: conCantidad.map(p => p.id) } },
      select: { productoId: true, precio: true },
    });
    const precioPorProducto = new Map(listasPrecio.map(lp => [lp.productoId, lp.precio]));

    return conCantidad.map(p => ({ ...p, precioSugerido: precioPorProducto.get(p.id) ?? null }));
  }

  // Precio de una lista de productos según una tarifa — se usa en el formulario de Nueva Cotización
  // para recalcular los consumos que el usuario ya armó en memoria cuando cambia la tarifa (Cubrimiento
  // o Responsable Económico), igual que recalcularPrecios hace para una cotización ya guardada.
  async getPreciosPorProductos(productoIds: string[], tarifaId: string) {
    if (productoIds.length === 0) return [];
    const listasPrecio = await this.prisma.listaPrecio.findMany({
      where: { subtarifaId: tarifaId, productoId: { in: productoIds } },
      select: { productoId: true, precio: true },
    });
    const precioPorProducto = new Map(listasPrecio.map(lp => [lp.productoId, lp.precio]));
    return productoIds.map(id => ({ productoId: id, precio: precioPorProducto.get(id) ?? null }));
  }

  // tarifaId se usa cuando todavía no existe la cotización (se está creando) y ya se conoce la
  // tarifa elegida en el formulario; cotizacionId se usa para una cotización ya guardada. Si se
  // pasan ambos, tarifaId gana (evita un round-trip extra a buscar la cotización).
  async searchProductos(search?: string, cotizacionId?: string, tarifaId?: string) {
    const searchTerm = search?.trim();
    const productosRaw = await this.prisma.producto.findMany({
      where: {
        categoriaId: { in: CATEGORIAS_COTIZABLES },
        ...(searchTerm
          ? {
              OR: [
                { nombre: { contains: searchTerm, mode: 'insensitive' as const } },
                { referencia: { contains: searchTerm, mode: 'insensitive' as const } },
                { sistema: { sistema: { contains: searchTerm, mode: 'insensitive' as const } } },
              ],
            }
          : {}),
      },
      select: { id: true, nombre: true, referencia: true, sistema: { select: { sistema: true } } },
      orderBy: { nombre: 'asc' },
      // Sin término de búsqueda es el modo "ver todas las opciones" — se necesita un límite más
      // alto para que realmente se vean todas, no solo 20 (mismo criterio que searchTerceros).
      take: searchTerm ? 20 : 200,
    });
    const productos = productosRaw.map(p => ({ id: p.id, nombre: p.nombre, referencia: p.referencia, sistema: p.sistema?.sistema ?? null }));

    if (productos.length === 0) {
      return productos.map(p => ({ ...p, precioSugerido: null as number | null }));
    }

    let subtarifaId = tarifaId;
    if (!subtarifaId && cotizacionId) {
      const cotizacion = await this.prisma.cotizacion.findUnique({
        where: { id: cotizacionId },
        select: { tarifaId: true },
      });
      subtarifaId = cotizacion?.tarifaId ?? undefined;
    }
    if (!subtarifaId) {
      return productos.map(p => ({ ...p, precioSugerido: null as number | null }));
    }

    const listasPrecio = await this.prisma.listaPrecio.findMany({
      where: { subtarifaId, productoId: { in: productos.map(p => p.id) } },
      select: { productoId: true, precio: true },
    });
    const precioPorProducto = new Map(listasPrecio.map(lp => [lp.productoId, lp.precio]));

    return productos.map(p => ({ ...p, precioSugerido: precioPorProducto.get(p.id) ?? null }));
  }

  async createItem(cotizacionId: string, dto: CreateDetCotizaDto, usuarioId?: string) {
    const cotizacion = await this.prisma.cotizacion.findUnique({
      where: { id: cotizacionId },
      select: { hospitalId: true, sede: { select: { nombre: true } } },
    });
    if (!cotizacion) throw new NotFoundException('Cotización no encontrada');

    const producto = await this.prisma.producto.findUnique({
      where: { id: dto.productoId },
      select: { referencia: true },
    });

    const usuario = usuarioId
      ? await this.prisma.tercero.findUnique({ where: { id: usuarioId }, select: { nombreCompleto: true } })
      : null;

    const id = await this.generateId();

    return this.prisma.detCotiza.create({
      data: {
        id,
        cotizacionId,
        marcaDeTiempo: nowMexico(),
        hospitalId: cotizacion.hospitalId,
        referencia: producto?.referencia ?? null,
        productoId: dto.productoId,
        cantidad: dto.cantidad,
        valorUnitario: dto.valorUnitario,
        valor: dto.cantidad * dto.valorUnitario,
        observaciones: dto.observaciones,
        sede: cotizacion.sede?.nombre ?? null,
        usuario: usuario?.nombreCompleto ?? null,
      },
    });
  }

  async updateItem(itemId: string, dto: UpdateDetCotizaDto) {
    const item = await this.prisma.detCotiza.findUnique({ where: { id: itemId }, select: { id: true } });
    if (!item) throw new NotFoundException('Ítem no encontrado');

    const producto = await this.prisma.producto.findUnique({
      where: { id: dto.productoId },
      select: { referencia: true },
    });

    return this.prisma.detCotiza.update({
      where: { id: itemId },
      data: {
        productoId: dto.productoId,
        referencia: producto?.referencia ?? null,
        cantidad: dto.cantidad,
        valorUnitario: dto.valorUnitario,
        valor: dto.cantidad * dto.valorUnitario,
      },
    });
  }

  async deleteItem(itemId: string) {
    await this.prisma.detCotiza.delete({ where: { id: itemId } });
    return { success: true };
  }

  // Cuando en edición cambia el Cubrimiento o el Responsable Económico (y por lo tanto la tarifa
  // resuelta), los consumos ya agregados deben reflejar el precio de la nueva tarifa. Los productos
  // que no tengan precio en la nueva tarifa se dejan con su valor anterior (se cuentan en "omitidos"
  // para que el frontend pueda avisar que deben revisarse manualmente).
  async recalcularPrecios(cotizacionId: string, tarifaId: string) {
    const items = await this.prisma.detCotiza.findMany({
      where: { cotizacionId },
      select: { id: true, productoId: true, cantidad: true },
    });
    if (items.length === 0) return { actualizados: 0, omitidos: 0 };

    const productoIds = items.map(i => i.productoId).filter((id): id is string => id !== null);
    const listasPrecio = productoIds.length
      ? await this.prisma.listaPrecio.findMany({
          where: { subtarifaId: tarifaId, productoId: { in: productoIds } },
          select: { productoId: true, precio: true },
        })
      : [];
    const precioPorProducto = new Map(listasPrecio.map(lp => [lp.productoId, lp.precio]));

    const itemsConPrecio = items
      .map(item => ({ item, precio: item.productoId ? precioPorProducto.get(item.productoId) : undefined }))
      .filter((x): x is { item: (typeof items)[number]; precio: Prisma.Decimal } =>
        x.precio !== undefined && x.precio !== null && x.item.cantidad !== null,
      );

    if (itemsConPrecio.length > 0) {
      await this.prisma.$transaction(
        itemsConPrecio.map(({ item, precio }) =>
          this.prisma.detCotiza.update({
            where: { id: item.id },
            data: { valorUnitario: precio, valor: Number(item.cantidad) * Number(precio) },
          }),
        ),
      );
    }

    return { actualizados: itemsConPrecio.length, omitidos: items.length - itemsConPrecio.length };
  }

  private async generateId(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const id = randomBytes(4).toString('hex');
      const exists = await this.prisma.detCotiza.findUnique({ where: { id }, select: { id: true } });
      if (!exists) return id;
    }
    throw new Error('No se pudo generar un ID único para el ítem de cotización');
  }

  // Las cotizaciones antiguas tienen id tipo "CT-" + hex aleatorio (8 caracteres, pueden incluir
  // a-f) — el formato nuevo es "CT-" + 8 dígitos consecutivos. Se filtra con esa regex exacta en
  // vez de un simple startsWith('CT-'), porque un id viejo como "CT-05f3a1b2" igual empieza con
  // dígitos y un parseInt ingenuo lo leería como si fuera un número de cotización real.
  private async generateCotizacionId(): Promise<string> {
    const [last] = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM cotizaciones WHERE id ~ '^CT-[0-9]{8}$' ORDER BY id DESC LIMIT 1
    `;
    const nextNum = last ? Number.parseInt(last.id.replace('CT-', ''), 10) + 1 : 1;

    for (let attempt = 0; attempt < 5; attempt++) {
      const id = `CT-${String(nextNum + attempt).padStart(8, '0')}`;
      const exists = await this.prisma.cotizacion.findUnique({ where: { id }, select: { id: true } });
      if (!exists) return id;
    }
    throw new Error('No se pudo generar un ID único para la cotización');
  }
}
