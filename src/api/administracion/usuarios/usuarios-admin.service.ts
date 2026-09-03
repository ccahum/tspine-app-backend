import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@app/prisma/prisma.service';
import { Constants } from '@app/constants/constants';
import { CreateUsuarioDesdeTerceroDto } from './dto/create-usuario-desde-tercero.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { PerfilOptionDto, TerceroDisponibleDto, UsuarioAdminItemDto } from './dto/usuario-admin-response.dto';

const SALT_ROUNDS = 10;

const USUARIO_SELECT = {
  id: true,
  nombreCompleto: true,
  correo: true,
  perfilId: true,
  sedeId: true,
  activo: true,
  perfil: { select: { nombre: true } },
  sede: { select: { nombre: true } },
  totp: { select: { activado: true } },
} as const;

type UsuarioRegistro = {
  id: string;
  nombreCompleto: string;
  correo: string | null;
  perfilId: string | null;
  sedeId: string | null;
  activo: boolean;
  perfil: { nombre: string } | null;
  sede: { nombre: string } | null;
  totp: { activado: boolean } | null;
};

@Injectable()
export class UsuariosAdminService {
  constructor(private readonly prisma: PrismaService) {}

  private map(u: UsuarioRegistro): UsuarioAdminItemDto {
    return {
      id: u.id,
      nombreCompleto: u.nombreCompleto,
      correo: u.correo,
      perfilId: u.perfilId,
      perfilNombre: u.perfil?.nombre ?? null,
      sedeId: u.sedeId,
      sedeNombre: u.sede?.nombre ?? null,
      activo: u.activo,
      totpActivado: u.totp?.activado ?? false,
    };
  }

  async findAll(): Promise<UsuarioAdminItemDto[]> {
    const usuarios = await this.prisma.tercero.findMany({
      where: { correo: { not: null }, passwordHash: { not: null } },
      select: USUARIO_SELECT,
      orderBy: { nombreCompleto: 'asc' },
    });
    return usuarios.map(u => this.map(u));
  }

  async findPerfiles(): Promise<PerfilOptionDto[]> {
    return this.prisma.perfil.findMany({
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    });
  }

  // Terceros con clasificación EMPLEADO que todavía no pueden iniciar sesión — lo que define
  // "ya tiene cuenta" es el passwordHash, no el correo (varios empleados ya tienen un correo
  // cargado del sistema viejo aunque nunca hayan tenido contraseña en este).
  async findTercerosDisponibles(q?: string): Promise<TerceroDisponibleDto[]> {
    const disponibles = await this.prisma.tercero.findMany({
      where: {
        passwordHash: null,
        clasificaciones: { some: { clasificacion: 'EMPLEADO' } },
        ...(q?.trim() ? { nombreCompleto: { contains: q.trim(), mode: 'insensitive' } } : {}),
      },
      select: { id: true, nombreCompleto: true, correo: true },
      orderBy: { nombreCompleto: 'asc' },
      take: 20,
    });
    return disponibles;
  }

  async createFromTercero(dto: CreateUsuarioDesdeTerceroDto): Promise<UsuarioAdminItemDto> {
    const tercero = await this.prisma.tercero.findUnique({
      where: { id: dto.terceroId },
      include: { clasificaciones: true },
    });
    if (!tercero) {
      throw new NotFoundException('El tercero indicado no existe');
    }
    if (tercero.passwordHash) {
      throw new ConflictException('Este tercero ya tiene una cuenta de usuario');
    }
    if (!tercero.clasificaciones.some(c => c.clasificacion === 'EMPLEADO')) {
      throw new BadRequestException('Solo se puede dar acceso a terceros con clasificación Empleado');
    }

    const correo = `${dto.usuario}@${Constants.Auth.EMAIL_DOMAIN}`;
    const existente = await this.prisma.tercero.findFirst({ where: { correo, id: { not: dto.terceroId } } });
    if (existente) {
      throw new ConflictException('Ya existe un usuario con ese nombre de usuario');
    }

    const perfil = await this.prisma.perfil.findUnique({ where: { id: dto.perfilId } });
    if (!perfil) {
      throw new BadRequestException('El perfil indicado no existe');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const actualizado = await this.prisma.tercero.update({
      where: { id: dto.terceroId },
      data: {
        correo,
        passwordHash,
        perfilId: dto.perfilId,
        sedeId: dto.sedeId,
        activo: true,
        debeCambiarPassword: true,
      },
      select: USUARIO_SELECT,
    });

    return this.map(actualizado);
  }

  async update(id: string, dto: UpdateUsuarioDto): Promise<UsuarioAdminItemDto> {
    const usuario = await this.prisma.tercero.findUnique({ where: { id } });
    if (!usuario || !usuario.correo || !usuario.passwordHash) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (dto.perfilId) {
      const perfil = await this.prisma.perfil.findUnique({ where: { id: dto.perfilId } });
      if (!perfil) throw new BadRequestException('El perfil indicado no existe');
    }

    const data: Record<string, unknown> = {};
    if (dto.nombreCompleto !== undefined) data.nombreCompleto = dto.nombreCompleto;
    if (dto.perfilId !== undefined) data.perfilId = dto.perfilId;
    if (dto.sedeId !== undefined) data.sedeId = dto.sedeId;
    if (dto.activo !== undefined) data.activo = dto.activo;
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
      data.debeCambiarPassword = true;
    }

    const actualizado = await this.prisma.tercero.update({
      where: { id },
      data,
      select: USUARIO_SELECT,
    });

    return this.map(actualizado);
  }
}
