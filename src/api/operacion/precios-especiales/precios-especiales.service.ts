import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '@app/prisma/prisma.service';
import { PrecioEspecialQueryDto } from './dto/precio-especial-query.dto';
import { CreatePrecioEspecialDto } from './dto/create-precio-especial.dto';
import { UpdatePrecioEspecialDto } from './dto/update-precio-especial.dto';

const PRECIO_ESPECIAL_SELECT = {
  id: true,
  productoId: true,
  contactoId: true,
  precio: true,
  notas: true,
  producto: { select: { referencia: true, nombre: true } },
  contacto: { select: { nombreCompleto: true } },
} as const;

type PrecioEspecialRow = {
  id: string;
  productoId: string | null;
  contactoId: string | null;
  precio: unknown;
  notas: string | null;
  producto: { referencia: string | null; nombre: string | null } | null;
  contacto: { nombreCompleto: string } | null;
};

function mapPrecioEspecial(pe: PrecioEspecialRow) {
  return {
    id: pe.id,
    productoId: pe.productoId,
    productoReferencia: pe.producto?.referencia ?? null,
    productoNombre: pe.producto?.nombre ?? null,
    contactoId: pe.contactoId,
    contacto: pe.contacto?.nombreCompleto ?? null,
    precio: pe.precio,
    notas: pe.notas,
    // BUSCABLE = CONCATENATE([CONTACTO],[PRODUCTO]) — formula original de AppSheet
    buscable: `${pe.contacto?.nombreCompleto ?? ''}${pe.producto?.referencia ?? ''}`,
  };
}

@Injectable()
export class PreciosEspecialesService {
  constructor(private readonly prisma: PrismaService) {}

  async searchProductos(search?: string) {
    return this.prisma.producto.findMany({
      where: search?.trim() ? { nombre: { contains: search, mode: 'insensitive' as const } } : {},
      select: { id: true, nombre: true, referencia: true },
      orderBy: { nombre: 'asc' },
      take: 20,
    });
  }

  async searchContactos(search?: string) {
    return this.prisma.tercero.findMany({
      where: search?.trim() ? { nombreCompleto: { contains: search, mode: 'insensitive' as const } } : {},
      select: { id: true, nombreCompleto: true },
      orderBy: { nombreCompleto: 'asc' },
      take: 20,
    });
  }

  async createPrecioEspecial(dto: CreatePrecioEspecialDto) {
    const id = await this.generateId();
    const pe = await this.prisma.precioEspecial.create({
      data: {
        id,
        productoId: dto.productoId,
        contactoId: dto.contactoId,
        precio: dto.precio,
        notas: dto.notas,
      },
      select: PRECIO_ESPECIAL_SELECT,
    });
    return mapPrecioEspecial(pe);
  }

  async updatePrecioEspecial(id: string, dto: UpdatePrecioEspecialDto) {
    const existing = await this.prisma.precioEspecial.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Precio especial no encontrado');

    const pe = await this.prisma.precioEspecial.update({
      where: { id },
      data: {
        productoId: dto.productoId,
        contactoId: dto.contactoId,
        precio: dto.precio,
        notas: dto.notas,
      },
      select: PRECIO_ESPECIAL_SELECT,
    });
    return mapPrecioEspecial(pe);
  }

  async deletePrecioEspecial(id: string) {
    await this.prisma.precioEspecial.delete({ where: { id } });
    return { success: true };
  }

  private async generateId(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const id = randomBytes(4).toString('hex');
      const exists = await this.prisma.precioEspecial.findUnique({ where: { id }, select: { id: true } });
      if (!exists) return id;
    }
    throw new Error('No se pudo generar un ID único para el precio especial');
  }

  async findAll(query: PrecioEspecialQueryDto) {
    const { page = 1, limit = 300, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search?.trim()) {
      where.OR = [
        { producto: { referencia: { contains: search, mode: 'insensitive' } } },
        { producto: { nombre: { contains: search, mode: 'insensitive' } } },
        { contacto: { nombreCompleto: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.precioEspecial.findMany({
        where,
        skip,
        take: limit,
        orderBy: { contacto: { nombreCompleto: 'asc' } },
        select: PRECIO_ESPECIAL_SELECT,
      }),
      this.prisma.precioEspecial.count({ where }),
    ]);

    return {
      data: data.map(mapPrecioEspecial),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
