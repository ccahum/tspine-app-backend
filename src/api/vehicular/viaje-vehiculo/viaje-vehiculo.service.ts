import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '@app/prisma/prisma.service';
import { nowMexico } from '@app/commons/date.utils';
import { decodeBase64DataUrl, extensionFromMime, mimeFromDataUrl, mimeFromExtension, resolveUploadPath, saveUploadFile, uploadFileExists } from '@app/commons/file-storage.utils';
import { ViajeVehiculoQueryDto } from './dto/viaje-vehiculo-query.dto';
import { CreateViajeVehiculoDto } from './dto/create-viaje-vehiculo.dto';

const MAX_FOTO_BYTES = 8 * 1024 * 1024;

const VIAJE_SELECT = {
  id: true,
  marcaTiempo: true,
  kilometrajeActual: true,
  sitioOrigen: true,
  sitioDestino: true,
  fotoTablero: true,
  diligencia: true,
  novedadesEstado: true,
  estadoActual: true,
  conductor: { select: { nombreCompleto: true } },
  sede: { select: { nombre: true } },
  vehiculo: { select: { placas: true } },
} as const;

type ViajeRow = {
  id: string;
  marcaTiempo: Date | null;
  kilometrajeActual: number | null;
  sitioOrigen: string | null;
  sitioDestino: string | null;
  fotoTablero: string | null;
  diligencia: string | null;
  novedadesEstado: string | null;
  estadoActual: boolean | null;
  conductor: { nombreCompleto: string } | null;
  sede: { nombre: string } | null;
  vehiculo: { placas: string | null } | null;
};

function mapViaje(v: ViajeRow) {
  return {
    id: v.id,
    marcaTiempo: v.marcaTiempo,
    conductor: v.conductor?.nombreCompleto ?? null,
    sede: v.sede?.nombre ?? null,
    vehiculo: v.vehiculo?.placas ?? null,
    kilometrajeActual: v.kilometrajeActual,
    sitioOrigen: v.sitioOrigen,
    sitioDestino: v.sitioDestino,
    fotoTablero: v.fotoTablero,
    fotoDisponible: uploadFileExists(v.fotoTablero),
    diligencia: v.diligencia,
    novedadesEstado: v.novedadesEstado,
    estadoActual: v.estadoActual,
  };
}

@Injectable()
export class ViajeVehiculoService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ViajeVehiculoQueryDto) {
    const { page = 1, limit = 50, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search?.trim()) {
      where.OR = [
        { conductor: { nombreCompleto: { contains: search, mode: 'insensitive' } } },
        { vehiculo: { placas: { contains: search, mode: 'insensitive' } } },
        { diligencia: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.viajeVehiculo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { marcaTiempo: 'desc' },
        select: VIAJE_SELECT,
      }),
      this.prisma.viajeVehiculo.count({ where }),
    ]);

    return {
      data: data.map(mapViaje),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFotoArchivo(id: string) {
    const viaje = await this.prisma.viajeVehiculo.findUnique({ where: { id }, select: { fotoTablero: true } });
    if (!viaje?.fotoTablero || !uploadFileExists(viaje.fotoTablero)) {
      throw new NotFoundException('Fotografía no disponible');
    }
    return { path: resolveUploadPath(viaje.fotoTablero), mime: mimeFromExtension(viaje.fotoTablero) };
  }

  async createViaje(dto: CreateViajeVehiculoDto, conductorId: string) {
    const id = randomUUID();

    const contents = decodeBase64DataUrl(dto.fotografia);
    if (contents.length > MAX_FOTO_BYTES) {
      throw new BadRequestException('La fotografía es demasiado grande (máximo 8MB).');
    }
    const ext = extensionFromMime(mimeFromDataUrl(dto.fotografia));
    const fotoTablero = saveUploadFile('viajes-vehiculo', `${id}.${ext}`, contents);

    const viaje = await this.prisma.viajeVehiculo.create({
      data: {
        id,
        marcaTiempo: nowMexico(),
        conductorId,
        vehiculoId: dto.vehiculoId,
        sedeId: dto.sedeId,
        kilometrajeActual: dto.kilometrajeActual,
        sitioOrigen: dto.sitioOrigen ?? null,
        sitioDestino: dto.sitioDestino,
        fotoTablero,
        diligencia: dto.diligencia,
        novedadesEstado: dto.novedadesEstado ?? null,
        estadoActual: true,
      },
      select: VIAJE_SELECT,
    });
    return mapViaje(viaje);
  }
}
