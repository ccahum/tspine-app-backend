import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '@app/prisma/prisma.service';
import { nowMexico } from '@app/commons/date.utils';
import { TerceroQueryDto } from './dto/tercero-query.dto';
import { CreateTerceroDto } from './dto/create-tercero.dto';
import { UpdateTerceroDto } from './dto/update-tercero.dto';
import { CreateTerceroContactoDto } from './dto/create-tercero-contacto.dto';
import { CreateTerceroCuentaDto } from './dto/create-tercero-cuenta.dto';
import { UpdateTerceroContactoDto } from './dto/update-tercero-contacto.dto';

const TERCERO_SELECT = {
  id: true,
  nombreCompleto: true,
  correo: true,
  activo: true,
  tipoContacto: true,
  tipoPersona: true,
  sede: { select: { nombre: true } },
  cargo: { select: { nombre: true } },
  clasificaciones: { select: { clasificacion: true } },
} as const;

type TerceroRow = {
  id: string;
  nombreCompleto: string;
  correo: string | null;
  activo: boolean;
  tipoContacto: boolean | null;
  tipoPersona: boolean | null;
  sede: { nombre: string } | null;
  cargo: { nombre: string } | null;
  clasificaciones: { clasificacion: string }[];
};

function mapTercero(t: TerceroRow) {
  return {
    id: t.id,
    nombreCompleto: t.nombreCompleto,
    correo: t.correo,
    activo: t.activo,
    tipoContacto: t.tipoContacto,
    tipoPersona: t.tipoPersona,
    sede: t.sede?.nombre ?? null,
    cargo: t.cargo?.nombre ?? null,
    clasificaciones: t.clasificaciones.map(c => c.clasificacion),
  };
}

@Injectable()
export class TercerosAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: TerceroQueryDto) {
    const { page = 1, limit = 50, search, clasificacion } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search?.trim()) {
      where.OR = [
        { nombreCompleto: { contains: search, mode: 'insensitive' } },
        { correo: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (clasificacion) {
      where.clasificaciones = { some: { clasificacion } };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.tercero.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nombreCompleto: 'asc' },
        select: TERCERO_SELECT,
      }),
      this.prisma.tercero.count({ where }),
    ]);

    return {
      data: data.map(mapTercero),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const tercero = await this.prisma.tercero.findUnique({
      where: { id },
      select: {
        id: true,
        primerNombre: true,
        segundoNombre: true,
        primerApellido: true,
        segundoApellido: true,
        nombreCompleto: true,
        nombreComercial: true,
        correo: true,
        activo: true,
        tipoContacto: true,
        tipoPersona: true,
        observaciones: true,
        creadoPor: true,
        creadoEn: true,
        mir: true,
        grupo: true,
        ciudadId: true,
        estadoId: true,
        paisId: true,
        fechaNacimiento: true,
        fotoPerfilUrl: true,
        ciudad: { select: { nombre: true } },
        estado: { select: { nombre: true } },
        pais: { select: { nombre: true } },
        sede: { select: { nombre: true } },
        cargo: { select: { nombre: true } },
        perfil: { select: { nombre: true } },
        clasificaciones: { select: { clasificacion: true } },
        contactos: {
          select: { id: true, tipo: true, dato: true, personaContacto: true, notas: true, principal: true },
        },
        cuentas: {
          select: {
            id: true, tipoDeCuenta: true, tipo: true, bancoId: true, noDeCuenta: true, clabeInterbancaria: true,
            banco: { select: { nombre: true } },
          },
        },
        datosFiscales: {
          select: { rfc: true, razonSocial: true, regimenFiscalId: true, codigoPostalFiscal: true, usoCfdiId: true, direccionFiscal: true },
        },
      },
    });
    if (!tercero) throw new NotFoundException('Tercero no encontrado');

    return {
      id: tercero.id,
      primerNombre: tercero.primerNombre,
      segundoNombre: tercero.segundoNombre,
      primerApellido: tercero.primerApellido,
      segundoApellido: tercero.segundoApellido,
      nombreCompleto: tercero.nombreCompleto,
      nombreComercial: tercero.nombreComercial,
      correo: tercero.correo,
      activo: tercero.activo,
      tipoContacto: tercero.tipoContacto,
      tipoPersona: tercero.tipoPersona,
      observaciones: tercero.observaciones,
      creadoPor: tercero.creadoPor,
      creadoEn: tercero.creadoEn,
      mir: tercero.mir,
      grupo: !!tercero.grupo,
      ciudadId: tercero.ciudadId,
      estadoId: tercero.estadoId,
      paisId: tercero.paisId,
      fechaNacimiento: tercero.fechaNacimiento,
      fotoPerfilUrl: tercero.fotoPerfilUrl,
      ciudad: tercero.ciudad?.nombre ?? null,
      estado: tercero.estado?.nombre ?? null,
      pais: tercero.pais?.nombre ?? null,
      sede: tercero.sede?.nombre ?? null,
      cargo: tercero.cargo?.nombre ?? null,
      perfil: tercero.perfil?.nombre ?? null,
      clasificaciones: tercero.clasificaciones.map(c => c.clasificacion),
      contactos: tercero.contactos,
      cuentas: tercero.cuentas.map(c => ({
        id: c.id,
        tipoDeCuenta: c.tipoDeCuenta,
        tipo: c.tipo,
        bancoId: c.bancoId,
        noDeCuenta: c.noDeCuenta,
        clabeInterbancaria: c.clabeInterbancaria,
        banco: c.banco?.nombre ?? null,
      })),
      datosFiscales: tercero.datosFiscales ? {
        rfc: tercero.datosFiscales.rfc,
        razonSocial: tercero.datosFiscales.razonSocial,
        regimenFiscalId: tercero.datosFiscales.regimenFiscalId,
        codigoPostalFiscal: tercero.datosFiscales.codigoPostalFiscal,
        usoCfdiId: tercero.datosFiscales.usoCfdiId,
        direccionFiscal: tercero.datosFiscales.direccionFiscal,
      } : null,
    };
  }

  async getCatalogos() {
    const [cargos, ciudades, estados, paises, regimenesFiscales, usosCfdi, bancos] = await this.prisma.$transaction([
      this.prisma.cargo.findMany({ select: { id: true, nombre: true }, orderBy: { nombre: 'asc' } }),
      this.prisma.ciudad.findMany({ select: { id: true, nombre: true, estadoId: true }, orderBy: { nombre: 'asc' } }),
      this.prisma.estado.findMany({ select: { id: true, nombre: true, paisId: true }, orderBy: { nombre: 'asc' } }),
      this.prisma.pais.findMany({ select: { id: true, nombre: true }, orderBy: { nombre: 'asc' } }),
      this.prisma.regimenFiscal.findMany({ select: { id: true, descripcion: true }, orderBy: { descripcion: 'asc' } }),
      this.prisma.usoCfdi.findMany({ select: { id: true, descripcion: true }, orderBy: { descripcion: 'asc' } }),
      this.prisma.banco.findMany({ select: { id: true, nombre: true }, orderBy: { nombre: 'asc' } }),
    ]);
    return { cargos, ciudades, estados, paises, regimenesFiscales, usosCfdi, bancos };
  }

  async createTercero(dto: CreateTerceroDto, creadoPorId: string) {
    const creador = await this.prisma.tercero.findUnique({ where: { id: creadoPorId }, select: { correo: true } });
    if (!creador) throw new NotFoundException('Usuario autenticado no encontrado');

    const nombreCompleto = dto.nombreCompleto?.trim() || dto.primerNombre;

    const existente = await this.prisma.tercero.findFirst({
      where: { nombreCompleto: { equals: nombreCompleto, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existente) throw new ConflictException('Ya existe un tercero registrado con este nombre completo.');

    const tercero = await this.prisma.tercero.create({
      data: {
        primerNombre: dto.primerNombre,
        segundoNombre: dto.segundoNombre,
        primerApellido: dto.primerApellido,
        segundoApellido: dto.segundoApellido,
        nombreCompleto,
        nombreComercial: dto.nombreComercial,
        tipoContacto: dto.tipoContacto,
        tipoPersona: dto.tipoPersona,
        ciudadId: dto.ciudadId,
        estadoId: dto.estadoId,
        paisId: dto.paisId,
        observaciones: dto.observaciones,
        mir: dto.mir ?? false,
        // "GRUPO?" en Datos de Facturación es un toggle Sí/No aparte, no una ClasificacionTercero
        // (confirmado con el usuario) — el campo grupo en el schema es texto libre legado.
        grupo: dto.grupo ? 'Sí' : null,
        creadoPor: creador.correo,
        creadoEn: nowMexico(),
        clasificaciones: dto.clasificaciones?.length
          ? { create: dto.clasificaciones.map(c => ({ clasificacion: c })) }
          : undefined,
        datosFiscales: dto.datosFiscales
          ? {
              create: {
                rfc: dto.datosFiscales.rfc,
                razonSocial: dto.datosFiscales.razonSocial,
                regimenFiscalId: dto.datosFiscales.regimenFiscalId,
                codigoPostalFiscal: dto.datosFiscales.codigoPostalFiscal,
                usoCfdiId: dto.datosFiscales.usoCfdiId,
                direccionFiscal: dto.datosFiscales.direccionFiscal,
              },
            }
          : undefined,
      },
      select: TERCERO_SELECT,
    });
    return mapTercero(tercero);
  }

  async updateTercero(id: string, dto: UpdateTerceroDto) {
    const existing = await this.prisma.tercero.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Tercero no encontrado');

    const tercero = await this.prisma.tercero.update({
      where: { id },
      data: {
        primerNombre: dto.primerNombre,
        segundoNombre: dto.segundoNombre,
        primerApellido: dto.primerApellido,
        segundoApellido: dto.segundoApellido,
        nombreCompleto: dto.nombreCompleto?.trim() || undefined,
        nombreComercial: dto.nombreComercial,
        tipoContacto: dto.tipoContacto,
        tipoPersona: dto.tipoPersona,
        ciudadId: dto.ciudadId,
        estadoId: dto.estadoId,
        paisId: dto.paisId,
        observaciones: dto.observaciones,
        mir: dto.mir,
        grupo: dto.grupo === undefined ? undefined : (dto.grupo ? 'Sí' : null),
        activo: dto.activo,
        clasificaciones: dto.clasificaciones !== undefined
          ? { deleteMany: {}, create: dto.clasificaciones.map(c => ({ clasificacion: c })) }
          : undefined,
        datosFiscales: dto.datosFiscales
          ? {
              upsert: {
                create: {
                  rfc: dto.datosFiscales.rfc,
                  razonSocial: dto.datosFiscales.razonSocial,
                  regimenFiscalId: dto.datosFiscales.regimenFiscalId,
                  codigoPostalFiscal: dto.datosFiscales.codigoPostalFiscal,
                  usoCfdiId: dto.datosFiscales.usoCfdiId,
                  direccionFiscal: dto.datosFiscales.direccionFiscal,
                },
                update: {
                  rfc: dto.datosFiscales.rfc,
                  razonSocial: dto.datosFiscales.razonSocial,
                  regimenFiscalId: dto.datosFiscales.regimenFiscalId,
                  codigoPostalFiscal: dto.datosFiscales.codigoPostalFiscal,
                  usoCfdiId: dto.datosFiscales.usoCfdiId,
                  direccionFiscal: dto.datosFiscales.direccionFiscal,
                },
              },
            }
          : undefined,
      },
      select: TERCERO_SELECT,
    });
    return mapTercero(tercero);
  }

  private async assertTerceroExists(terceroId: string) {
    const tercero = await this.prisma.tercero.findUnique({ where: { id: terceroId }, select: { id: true } });
    if (!tercero) throw new NotFoundException('Tercero no encontrado');
  }

  async createContacto(terceroId: string, dto: CreateTerceroContactoDto) {
    await this.assertTerceroExists(terceroId);
    return this.prisma.terceroContacto.create({
      data: {
        terceroId,
        tipo: dto.tipo,
        dato: dto.dato,
        personaContacto: dto.personaContacto,
        notas: dto.notas,
        principal: dto.principal ?? false,
      },
    });
  }

  async createCuenta(terceroId: string, dto: CreateTerceroCuentaDto) {
    await this.assertTerceroExists(terceroId);
    const esEfectivo = dto.tipo === 'Efectivo';
    return this.prisma.cuenta.create({
      data: {
        id: randomUUID(),
        terceroId,
        tipoDeCuenta: dto.tipoDeCuenta,
        tipo: dto.tipo,
        bancoId: esEfectivo ? null : dto.bancoId,
        noDeCuenta: esEfectivo ? null : dto.noDeCuenta,
        clabeInterbancaria: esEfectivo ? null : dto.clabeInterbancaria,
      },
    });
  }

  private async assertContactoExists(terceroId: string, contactoId: string) {
    const contacto = await this.prisma.terceroContacto.findUnique({ where: { id: contactoId }, select: { terceroId: true } });
    if (!contacto || contacto.terceroId !== terceroId) throw new NotFoundException('Dato de contacto no encontrado');
  }

  async updateContacto(terceroId: string, contactoId: string, dto: UpdateTerceroContactoDto) {
    await this.assertContactoExists(terceroId, contactoId);
    return this.prisma.terceroContacto.update({
      where: { id: contactoId },
      data: {
        tipo: dto.tipo,
        dato: dto.dato,
        personaContacto: dto.personaContacto,
        notas: dto.notas,
        principal: dto.principal,
      },
    });
  }

  async deleteContacto(terceroId: string, contactoId: string) {
    await this.assertContactoExists(terceroId, contactoId);
    await this.prisma.terceroContacto.delete({ where: { id: contactoId } });
  }

  private async assertCuentaExists(terceroId: string, cuentaId: string) {
    const cuenta = await this.prisma.cuenta.findUnique({ where: { id: cuentaId }, select: { terceroId: true } });
    if (!cuenta || cuenta.terceroId !== terceroId) throw new NotFoundException('Cuenta bancaria no encontrada');
  }

  async deleteCuenta(terceroId: string, cuentaId: string) {
    await this.assertCuentaExists(terceroId, cuentaId);
    try {
      await this.prisma.cuenta.delete({ where: { id: cuentaId } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw new ConflictException('No se puede eliminar esta cuenta porque ya tiene movimientos u operaciones asociadas.');
      }
      throw err;
    }
  }
}
