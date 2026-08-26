import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@app/prisma/prisma.service';
import { decodeBase64DataUrl, extensionFromMime, mimeFromDataUrl, mimeFromExtension, resolveUploadPath, saveUploadFile, uploadFileExists } from '@app/commons/file-storage.utils';
import { VehiculoCatalogoQueryDto } from './dto/vehiculo-catalogo-query.dto';
import { CreateVehiculoCatalogoDto } from './dto/create-vehiculo-catalogo.dto';
import { UpdateVehiculoCatalogoDto } from './dto/update-vehiculo-catalogo.dto';

const MAX_FOTO_BYTES = 8 * 1024 * 1024;

const VEHICULO_SELECT = {
  id: true,
  placas: true,
  nombre: true,
  marca: true,
  modelo: true,
  fotografia: true,
  kmActual: true,
  estado: true,
  sedeId: true,
  sede: { select: { nombre: true } },
} as const;

type VehiculoRow = {
  id: string;
  placas: string | null;
  nombre: string | null;
  marca: string | null;
  modelo: string | null;
  fotografia: string | null;
  kmActual: number | null;
  estado: string | null;
  sedeId: string | null;
  sede: { nombre: string } | null;
};

function mapVehiculo(v: VehiculoRow) {
  return {
    id: v.id,
    placas: v.placas,
    nombre: v.nombre,
    marca: v.marca,
    modelo: v.modelo,
    fotografia: v.fotografia,
    fotoDisponible: uploadFileExists(v.fotografia),
    kmActual: v.kmActual,
    estado: v.estado,
    sedeId: v.sedeId,
    sedeNombre: v.sede?.nombre ?? null,
  };
}

function saveFoto(id: string, fotografia: string): string {
  const contents = decodeBase64DataUrl(fotografia);
  if (contents.length > MAX_FOTO_BYTES) {
    throw new BadRequestException('La fotografía es demasiado grande (máximo 8MB).');
  }
  const ext = extensionFromMime(mimeFromDataUrl(fotografia));
  return saveUploadFile('vehiculo-catalogo', `${id}.${ext}`, contents);
}

@Injectable()
export class VehiculoCatalogoService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: VehiculoCatalogoQueryDto) {
    const { page = 1, limit = 300, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search?.trim()) {
      where.OR = [
        { placas: { contains: search, mode: 'insensitive' } },
        { nombre: { contains: search, mode: 'insensitive' } },
        { marca: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.vehiculoCatalogo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { placas: 'asc' },
        select: VEHICULO_SELECT,
      }),
      this.prisma.vehiculoCatalogo.count({ where }),
    ]);

    return {
      data: data.map(mapVehiculo),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createVehiculo(dto: CreateVehiculoCatalogoDto) {
    const id = dto.placas.trim().toUpperCase();
    const existing = await this.prisma.vehiculoCatalogo.findUnique({ where: { id }, select: { id: true } });
    if (existing) throw new ConflictException('Ya existe un vehículo con esas placas');

    const fotografia = saveFoto(id, dto.fotografia);

    const vehiculo = await this.prisma.vehiculoCatalogo.create({
      data: {
        id,
        placas: dto.placas.trim(),
        nombre: dto.nombre,
        marca: dto.marca,
        modelo: dto.modelo,
        fotografia,
        kmActual: dto.kmActual,
        sedeId: dto.sedeId,
        estado: dto.estado,
      },
      select: VEHICULO_SELECT,
    });
    return mapVehiculo(vehiculo);
  }

  async updateVehiculo(id: string, dto: UpdateVehiculoCatalogoDto) {
    const existing = await this.prisma.vehiculoCatalogo.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Vehículo no encontrado');

    const vehiculo = await this.prisma.vehiculoCatalogo.update({
      where: { id },
      data: {
        placas: dto.placas,
        nombre: dto.nombre,
        marca: dto.marca,
        modelo: dto.modelo,
        ...(dto.fotografia ? { fotografia: saveFoto(id, dto.fotografia) } : {}),
        kmActual: dto.kmActual,
        sedeId: dto.sedeId,
        estado: dto.estado,
      },
      select: VEHICULO_SELECT,
    });
    return mapVehiculo(vehiculo);
  }

  async deleteVehiculo(id: string) {
    await this.prisma.vehiculoCatalogo.delete({ where: { id } });
    return { success: true };
  }

  async getFotoArchivo(id: string) {
    const vehiculo = await this.prisma.vehiculoCatalogo.findUnique({ where: { id }, select: { fotografia: true } });
    if (!vehiculo?.fotografia || !uploadFileExists(vehiculo.fotografia)) {
      throw new NotFoundException('Fotografía no disponible');
    }
    return { path: resolveUploadPath(vehiculo.fotografia), mime: mimeFromExtension(vehiculo.fotografia) };
  }
}
