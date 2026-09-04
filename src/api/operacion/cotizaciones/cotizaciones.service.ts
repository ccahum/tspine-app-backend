import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '@app/prisma/prisma.service';
import { CotizacionQueryDto } from './dto/cotizacion-query.dto';
import { CreateDetCotizaDto } from './dto/create-det-cotiza.dto';
import { UpdateDetCotizaDto } from './dto/update-det-cotiza.dto';
import { UpdateCotizacionDto } from './dto/update-cotizacion.dto';
import { CreateCotizacionDto } from './dto/create-cotizacion.dto';

const COTIZACION_LIST_SELECT = {
  id: true,
  numCotizacion: true,
  fecha: true,
  medico: true,
  cirugia: true,
  status: true,
  usuario:  { select: { nombreCompleto: true } },
  hospital: { select: { nombreCompleto: true } },
  empresa:  { select: { nombreCompleto: true } },
  sede:     { select: { nombre: true } },
} as const;

@Injectable()
export class CotizacionesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: CotizacionQueryDto) {
    const { page = 1, limit = 300, search, dateFrom, dateTo } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

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

    const items = data.map(c => ({
      id: c.id,
      numCotizacion: c.numCotizacion,
      fecha: c.fecha,
      medico: c.medico,
      cirugia: c.cirugia,
      status: c.status,
      usuario: c.usuario?.nombreCompleto ?? null,
      hospital: c.hospital?.nombreCompleto ?? null,
      empresa: c.empresa?.nombreCompleto ?? null,
      sede: c.sede?.nombre ?? null,
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
      usuario: c.usuario?.nombreCompleto ?? null,
      hospitalId: c.hospitalId,
      hospital: c.hospital?.nombreCompleto ?? null,
      empresaId: c.empresaId,
      empresa: c.empresa?.nombreCompleto ?? null,
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
        marcaDeTiempo: new Date(),
        fecha: new Date(dto.fecha),
        dirigidoA: dto.dirigidoA,
        medico: dto.medico,
        hospitalId: dto.hospitalId,
        cirugia: dto.cirugia,
        cubrimientoId: dto.cubrimientoId,
        empresaId: dto.empresaId,
        responsableEconomicoId: dto.responsableEconomicoId,
        numProveedor: dto.numProveedor,
        tarifaId: dto.tarifaId ?? dto.cubrimientoId,
        tiempoEntrega: dto.tiempoEntrega,
        observaciones: dto.observaciones,
        paqueteId: dto.paqueteId,
        nivel: dto.nivel,
        tieneDcto: dto.tieneDcto ?? false,
        porcentajeDcto: dto.porcentajeDcto,
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
    if (dto.numProveedor !== undefined) data.numProveedor = dto.numProveedor;
    if (dto.tarifaId !== undefined) data.tarifaId = dto.tarifaId || null;
    if (dto.tiempoEntrega !== undefined) data.tiempoEntrega = dto.tiempoEntrega;
    if (dto.observaciones !== undefined) data.observaciones = dto.observaciones;
    if (dto.paqueteId !== undefined) data.paqueteId = dto.paqueteId || null;
    if (dto.nivel !== undefined) data.nivel = dto.nivel || null;
    if (dto.tieneDcto !== undefined) data.tieneDcto = dto.tieneDcto;
    if (dto.porcentajeDcto !== undefined) data.porcentajeDcto = dto.porcentajeDcto;
    if (dto.vrDcto !== undefined) data.vrDcto = dto.vrDcto;
    if (dto.impuestos !== undefined) data.impuestos = dto.impuestos;

    await this.prisma.cotizacion.update({ where: { id }, data });
    return this.getById(id);
  }

  async deleteCotizacion(id: string) {
    await this.prisma.cotizacion.delete({ where: { id } });
    return { success: true };
  }

  async searchTerceros(search?: string, clasificacion?: string) {
    return this.prisma.tercero.findMany({
      where: {
        ...(search?.trim() ? { nombreCompleto: { contains: search, mode: 'insensitive' as const } } : {}),
        ...(clasificacion ? { clasificaciones: { some: { clasificacion: clasificacion as any } } } : {}),
      },
      select: { id: true, nombreCompleto: true },
      orderBy: { nombreCompleto: 'asc' },
      take: 20,
    });
  }

  // Para autocompletar el campo Tarifa: si el Tercero (hospital/responsable económico) tiene
  // tarifa propia asignada (Tercero.tarifaId) se usa esa; si no, el formulario cae de vuelta al
  // cubrimiento general (mismo id que Tarifa.id de nivel superior, ver dto.tarifaId ?? dto.cubrimientoId
  // en createCotizacion).
  async getTerceroTarifa(terceroId: string) {
    const tercero = await this.prisma.tercero.findUnique({
      where: { id: terceroId },
      select: { tarifaId: true, tarifa: { select: { nombre: true } } },
    });
    return { tarifaId: tercero?.tarifaId ?? null, tarifaNombre: tercero?.tarifa?.nombre ?? null };
  }

  async getTarifas() {
    return this.prisma.tarifa.findMany({
      select: { id: true, nombre: true },
      orderBy: { orden: 'asc' },
    });
  }

  async getPaquetes() {
    return this.prisma.paqueteCotizacion.findMany({
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async searchProductos(search?: string, cotizacionId?: string) {
    const productos = await this.prisma.producto.findMany({
      where: search?.trim() ? { nombre: { contains: search, mode: 'insensitive' as const } } : {},
      select: { id: true, nombre: true, referencia: true },
      orderBy: { nombre: 'asc' },
      take: 20,
    });

    if (!cotizacionId || productos.length === 0) {
      return productos.map(p => ({ ...p, precioSugerido: null as number | null }));
    }

    const cotizacion = await this.prisma.cotizacion.findUnique({
      where: { id: cotizacionId },
      select: { tarifaId: true },
    });
    if (!cotizacion?.tarifaId) {
      return productos.map(p => ({ ...p, precioSugerido: null as number | null }));
    }

    const listasPrecio = await this.prisma.listaPrecio.findMany({
      where: { subtarifaId: cotizacion.tarifaId, productoId: { in: productos.map(p => p.id) } },
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
        marcaDeTiempo: new Date(),
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

  private async generateId(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const id = randomBytes(4).toString('hex');
      const exists = await this.prisma.detCotiza.findUnique({ where: { id }, select: { id: true } });
      if (!exists) return id;
    }
    throw new Error('No se pudo generar un ID único para el ítem de cotización');
  }

  private async generateCotizacionId(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const id = `CT-${randomBytes(4).toString('hex')}`;
      const exists = await this.prisma.cotizacion.findUnique({ where: { id }, select: { id: true } });
      if (!exists) return id;
    }
    throw new Error('No se pudo generar un ID único para la cotización');
  }
}
