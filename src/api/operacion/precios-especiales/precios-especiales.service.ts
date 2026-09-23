import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';
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
    const searchTerm = search?.trim();
    // Prisma no soporta un equivalente a unaccent() con el query builder normal — se usa SQL
    // crudo para que "instrumental" también encuentre "instrumêntal" y sea insensible a
    // mayúsculas/minúsculas Y acentos a la vez (mode:'insensitive' de Prisma solo cubre lo
    // segundo). Mismo patrón que searchTerceros en cotizaciones.service.ts.
    const searchFilter = searchTerm
      ? Prisma.sql`AND unaccent(p.nombre) ILIKE unaccent(${'%' + searchTerm + '%'})`
      : Prisma.empty;

    return this.prisma.$queryRaw<{ id: string; nombre: string | null; referencia: string | null }[]>`
      SELECT p.id_producto AS id, p.nombre, p.referencia
      FROM productos p
      WHERE true
      ${searchFilter}
      ORDER BY p.nombre ASC
      LIMIT 50
    `;
  }

  async searchContactos(search?: string) {
    const searchTerm = search?.trim();
    const searchFilter = searchTerm
      ? Prisma.sql`AND unaccent(t.nombre_completo) ILIKE unaccent(${'%' + searchTerm + '%'})`
      : Prisma.empty;

    return this.prisma.$queryRaw<{ id: string; nombreCompleto: string }[]>`
      SELECT t.id, t.nombre_completo AS "nombreCompleto"
      FROM terceros t
      WHERE true
      ${searchFilter}
      ORDER BY t.nombre_completo ASC
      LIMIT 50
    `;
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
