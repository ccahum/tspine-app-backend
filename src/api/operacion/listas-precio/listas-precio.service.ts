import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '@app/prisma/prisma.service';
import { ListaPrecioQueryDto } from './dto/lista-precio-query.dto';
import { UpdateListaPrecioDto } from './dto/update-lista-precio.dto';
import { CreateListaPrecioDto } from './dto/create-lista-precio.dto';

const LISTA_PRECIO_SELECT = {
  id: true,
  costoUtilidad: true,
  porcentajeGanancia: true,
  precio: true,
  formaActualizacion: true,
  productoId: true,
  subtarifaId: true,
  producto: { select: { referencia: true, nombre: true } },
  subtarifa: {
    select: {
      nombre: true,
      tipoActualizacion: true,
      tipoCubrimiento: { select: { nombre: true } },
    },
  },
} as const;

type ListaPrecioRow = {
  id: string;
  costoUtilidad: unknown;
  porcentajeGanancia: unknown;
  precio: unknown;
  formaActualizacion: string | null;
  productoId: string | null;
  subtarifaId: string | null;
  producto: { referencia: string | null; nombre: string | null } | null;
  subtarifa: { nombre: string; tipoActualizacion: boolean | null; tipoCubrimiento: { nombre: string } | null } | null;
};

function mapListaPrecio(lp: ListaPrecioRow) {
  return {
    id: lp.id,
    subtarifaId: lp.subtarifaId,
    subtarifa: lp.subtarifa?.nombre ?? null,
    dependeDe: lp.subtarifa?.tipoCubrimiento?.nombre ?? null,
    formula: lp.subtarifa?.tipoActualizacion ?? null,
    productoId: lp.productoId,
    productoReferencia: lp.producto?.referencia ?? null,
    productoNombre: lp.producto?.nombre ?? null,
    costoUtilidad: lp.costoUtilidad,
    porcentajeGanancia: lp.porcentajeGanancia,
    precio: lp.precio,
    formaActualizacion: lp.formaActualizacion,
  };
}

@Injectable()
export class ListasPrecioService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListaPrecioQueryDto) {
    const { page = 1, limit = 300, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search?.trim()) {
      where.OR = [
        { producto: { referencia: { contains: search, mode: 'insensitive' } } },
        { producto: { nombre: { contains: search, mode: 'insensitive' } } },
        { subtarifa: { nombre: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.listaPrecio.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ producto: { nombre: 'asc' } }, { subtarifa: { orden: 'asc' } }],
        select: LISTA_PRECIO_SELECT,
      }),
      this.prisma.listaPrecio.count({ where }),
    ]);

    return {
      data: data.map(mapListaPrecio),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async searchSubtarifas(search?: string) {
    const subtarifas = await this.prisma.tarifa.findMany({
      where: search?.trim() ? { nombre: { contains: search, mode: 'insensitive' as const } } : {},
      select: { id: true, nombre: true, tipoActualizacion: true, tipoCubrimiento: { select: { nombre: true } } },
      orderBy: { orden: 'asc' },
      take: 20,
    });
    return subtarifas.map(s => ({
      id: s.id,
      nombre: s.nombre,
      dependeDe: s.tipoCubrimiento?.nombre ?? null,
      formula: s.tipoActualizacion,
    }));
  }

  async searchProductos(search?: string) {
    return this.prisma.producto.findMany({
      where: search?.trim() ? { nombre: { contains: search, mode: 'insensitive' as const } } : {},
      select: { id: true, nombre: true, referencia: true },
      orderBy: { nombre: 'asc' },
      take: 20,
    });
  }

  async createListaPrecio(dto: CreateListaPrecioDto) {
    const id = await this.generateId();
    const lp = await this.prisma.listaPrecio.create({
      data: {
        id,
        subtarifaId: dto.subtarifaId,
        productoId: dto.productoId,
        costoUtilidad: dto.costoUtilidad,
        porcentajeGanancia: dto.porcentajeGanancia,
        precio: dto.precio,
        formaActualizacion: dto.formaActualizacion,
      },
      select: LISTA_PRECIO_SELECT,
    });
    return mapListaPrecio(lp);
  }

  private async generateId(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const id = randomBytes(4).toString('hex');
      const exists = await this.prisma.listaPrecio.findUnique({ where: { id }, select: { id: true } });
      if (!exists) return id;
    }
    throw new Error('No se pudo generar un ID único para la lista de precio');
  }

  async updateListaPrecio(id: string, dto: UpdateListaPrecioDto) {
    const existing = await this.prisma.listaPrecio.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Lista de precio no encontrada');

    const lp = await this.prisma.listaPrecio.update({
      where: { id },
      data: {
        subtarifaId: dto.subtarifaId,
        productoId: dto.productoId,
        costoUtilidad: dto.costoUtilidad,
        porcentajeGanancia: dto.porcentajeGanancia,
        precio: dto.precio,
        formaActualizacion: dto.formaActualizacion,
      },
      select: LISTA_PRECIO_SELECT,
    });
    return mapListaPrecio(lp);
  }

  async deleteListaPrecio(id: string) {
    await this.prisma.listaPrecio.delete({ where: { id } });
    return { success: true };
  }
}
