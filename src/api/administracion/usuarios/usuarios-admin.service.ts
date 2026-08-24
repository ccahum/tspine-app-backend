import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@app/prisma/prisma.service';
import { Constants } from '@app/constants/constants';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { PerfilOptionDto, UsuarioAdminItemDto } from './dto/usuario-admin-response.dto';

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

  async create(dto: CreateUsuarioDto): Promise<UsuarioAdminItemDto> {
    const correo = `${dto.usuario}@${Constants.Auth.EMAIL_DOMAIN}`;

    const existente = await this.prisma.tercero.findFirst({ where: { correo } });
    if (existente) {
      throw new ConflictException('Ya existe un usuario con ese nombre de usuario');
    }

    const perfil = await this.prisma.perfil.findUnique({ where: { id: dto.perfilId } });
    if (!perfil) {
      throw new BadRequestException('El perfil indicado no existe');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const creado = await this.prisma.tercero.create({
      data: {
        nombreCompleto: dto.nombreCompleto,
        correo,
        passwordHash,
        perfilId: dto.perfilId,
        sedeId: dto.sedeId,
        activo: true,
        clasificaciones: { create: [{ clasificacion: 'EMPLEADO' }] },
      },
      select: USUARIO_SELECT,
    });

    return this.map(creado);
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
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const actualizado = await this.prisma.tercero.update({
      where: { id },
      data,
      select: USUARIO_SELECT,
    });

    return this.map(actualizado);
  }
}
