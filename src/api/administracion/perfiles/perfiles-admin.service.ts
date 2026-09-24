import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '@app/prisma/prisma.service';
import { SUBMODULE_REGISTRY } from '@app/commons/authorization/submodule-registry';
import { CreatePerfilDto } from './dto/create-perfil.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';
import { UpdatePerfilAccesosDto } from './dto/update-perfil-accesos.dto';
import { PerfilAdminItemDto, SubmoduleCatalogItemDto } from './dto/perfil-admin-response.dto';

const PERFIL_SELECT = {
  id: true,
  nombre: true,
  reglas: true,
  vistaInicial: true,
  accesoRestringido: true,
  vistas: { select: { vistaNombre: true } },
} as const;

type PerfilRegistro = {
  id: string;
  nombre: string;
  reglas: string;
  vistaInicial: string | null;
  accesoRestringido: boolean;
  vistas: { vistaNombre: string }[];
};

@Injectable()
export class PerfilesAdminService {
  constructor(private readonly prisma: PrismaService) {}

  private map(p: PerfilRegistro): PerfilAdminItemDto {
    return {
      id: p.id,
      nombre: p.nombre,
      reglas: p.reglas,
      vistaInicial: p.vistaInicial,
      accesoRestringido: p.accesoRestringido,
      vistas: p.vistas.map(v => v.vistaNombre),
    };
  }

  async findAll(): Promise<PerfilAdminItemDto[]> {
    const perfiles = await this.prisma.perfil.findMany({
      select: PERFIL_SELECT,
      orderBy: { nombre: 'asc' },
    });
    return perfiles.map(p => this.map(p));
  }

  findCatalogoVistas(): SubmoduleCatalogItemDto[] {
    return SUBMODULE_REGISTRY.map(({ id, modulo, moduloLabel, label }) => ({ id, modulo, moduloLabel, label }));
  }

  async create(dto: CreatePerfilDto): Promise<PerfilAdminItemDto> {
    const creado = await this.prisma.perfil.create({
      data: { id: randomUUID(), nombre: dto.nombre, reglas: dto.reglas },
      select: PERFIL_SELECT,
    });
    return this.map(creado);
  }

  async update(id: string, dto: UpdatePerfilDto): Promise<PerfilAdminItemDto> {
    const perfil = await this.prisma.perfil.findUnique({ where: { id } });
    if (!perfil) throw new NotFoundException('Perfil no encontrado');

    const data: Record<string, unknown> = {};
    if (dto.nombre !== undefined) data.nombre = dto.nombre;
    if (dto.reglas !== undefined) data.reglas = dto.reglas;

    const actualizado = await this.prisma.perfil.update({ where: { id }, data, select: PERFIL_SELECT });
    return this.map(actualizado);
  }

  async updateAccesos(id: string, dto: UpdatePerfilAccesosDto): Promise<PerfilAdminItemDto> {
    const perfil = await this.prisma.perfil.findUnique({ where: { id } });
    if (!perfil) throw new NotFoundException('Perfil no encontrado');

    const idsValidos = new Set(SUBMODULE_REGISTRY.map(s => s.id));
    const vistasInvalidas = dto.vistas.filter(v => !idsValidos.has(v));
    if (vistasInvalidas.length > 0) {
      throw new BadRequestException(`Vista(s) desconocida(s): ${vistasInvalidas.join(', ')}`);
    }
    if (dto.vistaInicial && !dto.vistas.includes(dto.vistaInicial)) {
      throw new BadRequestException('La vista inicial debe estar incluida en las vistas asignadas');
    }

    const actualizado = await this.prisma.$transaction(async tx => {
      await tx.perfil.update({
        where: { id },
        data: { accesoRestringido: dto.accesoRestringido, vistaInicial: dto.vistaInicial ?? null },
      });
      await tx.perfilVista.deleteMany({ where: { perfilId: id } });
      if (dto.vistas.length > 0) {
        await tx.perfilVista.createMany({ data: dto.vistas.map(vistaNombre => ({ perfilId: id, vistaNombre })) });
      }
      return tx.perfil.findUniqueOrThrow({ where: { id }, select: PERFIL_SELECT });
    });

    return this.map(actualizado);
  }
}
