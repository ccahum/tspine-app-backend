import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@app/prisma/prisma.service';
import { ProgramacionesRepositoryService } from '@app/shared/repositories/programaciones/programaciones.repository.service';
import { NotificacionesService } from '@app/shared/services/notificaciones.service';
import { esSuperAdminPerfil, PERFIL_SUPER_ADMIN } from '@app/commons/authorization/super-admin.util';
import { CreateSolicitudProgramacionDto } from './dto/create-solicitud-programacion.dto';
import { UpdateEstadoSolicitudDto } from './dto/update-estado-solicitud.dto';
import { EstadoSolicitud } from './dto/solicitud-programacion-query.dto';

// Pendiente: reemplazar por la lista real de 2-3 revisores una vez que el negocio la defina —
// por ahora solo el super-admin puede revisar.

const SOLICITUD_SELECT = {
  id: true,
  fechaQx: true,
  horaQx: true,
  consumo: true,
  observaciones: true,
  estado: true,
  motivoRechazo: true,
  fechaRevision: true,
  programacionId: true,
  createdAt: true,
  sedeId: true,
  hospitalId: true,
  sede: { select: { nombre: true } },
  hospital: { select: { nombre: true } },
  solicitante: { select: { id: true, nombreCompleto: true } },
  revisor: { select: { id: true, nombreCompleto: true } },
  medicos: { select: { medico: { select: { id: true, nombreCompleto: true } } } },
} as const;

type SolicitudRegistro = {
  id: string;
  fechaQx: Date | null;
  horaQx: string | null;
  consumo: string | null;
  observaciones: string | null;
  estado: string;
  motivoRechazo: string | null;
  fechaRevision: Date | null;
  programacionId: string | null;
  createdAt: Date;
  sedeId: string | null;
  hospitalId: string | null;
  sede: { nombre: string } | null;
  hospital: { nombre: string } | null;
  solicitante: { id: string; nombreCompleto: string } | null;
  revisor: { id: string; nombreCompleto: string } | null;
  medicos: { medico: { id: string; nombreCompleto: string } }[];
};

export interface SolicitudProgramacionItem {
  id: string;
  fechaQx: Date | null;
  horaQx: string | null;
  sedeId: string | null;
  sede: string | null;
  hospitalId: string | null;
  hospital: string | null;
  medicos: { id: string; nombreCompleto: string }[];
  consumo: string | null;
  observaciones: string | null;
  estado: string;
  motivoRechazo: string | null;
  solicitante: string | null;
  revisor: string | null;
  fechaRevision: Date | null;
  programacionId: string | null;
  createdAt: Date;
}

@Injectable()
export class SolicitudProgramacionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly programacionesRepository: ProgramacionesRepositoryService,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  async esRevisor(usuarioId: string): Promise<boolean> {
    const usuario = await this.prisma.tercero.findUnique({
      where: { id: usuarioId },
      select: { perfilId: true, perfil: { select: { nombre: true } } },
    });
    return esSuperAdminPerfil(usuario);
  }

  // Todos los usuarios que pueden revisar solicitudes (hoy: solo super-admin, ver nota arriba).
  private async getRevisorIds(): Promise<string[]> {
    const revisores = await this.prisma.tercero.findMany({
      where: { OR: [{ perfilId: PERFIL_SUPER_ADMIN }, { perfil: { nombre: { equals: PERFIL_SUPER_ADMIN, mode: 'insensitive' } } }] },
      select: { id: true },
    });
    return revisores.map(r => r.id);
  }

  private mapItem(s: SolicitudRegistro): SolicitudProgramacionItem {
    return {
      id: s.id,
      fechaQx: s.fechaQx,
      horaQx: s.horaQx,
      sedeId: s.sedeId,
      sede: s.sede?.nombre ?? null,
      hospitalId: s.hospitalId,
      hospital: s.hospital?.nombre ?? null,
      medicos: s.medicos.map(m => m.medico),
      consumo: s.consumo,
      observaciones: s.observaciones,
      estado: s.estado,
      motivoRechazo: s.motivoRechazo,
      solicitante: s.solicitante?.nombreCompleto ?? null,
      revisor: s.revisor?.nombreCompleto ?? null,
      fechaRevision: s.fechaRevision,
      programacionId: s.programacionId,
      createdAt: s.createdAt,
    };
  }

  async findAll(usuarioId: string, estado?: EstadoSolicitud, page = 1, limit = 20) {
    const esRevisor = await this.esRevisor(usuarioId);
    const baseWhere = esRevisor ? {} : { solicitanteId: usuarioId };

    // Antes se traían TODOS los registros visibles (con sus 6 relaciones) solo para contar por
    // pestaña y paginar en memoria. El conteo por estado se hace con groupBy (agregado en la
    // base, sin traer filas), y la página pedida se pagina de verdad con skip/take — las tres
    // consultas corren en paralelo.
    const [conteosRaw, total, pagina] = await Promise.all([
      this.prisma.solicitudProgramacion.groupBy({
        by: ['estado'],
        where: baseWhere,
        _count: { estado: true },
      }),
      this.prisma.solicitudProgramacion.count({ where: { ...baseWhere, ...(estado ? { estado } : {}) } }),
      this.prisma.solicitudProgramacion.findMany({
        where: { ...baseWhere, ...(estado ? { estado } : {}) },
        select: SOLICITUD_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const conteos = { PENDIENTE: 0, APROBADA: 0, RECHAZADA: 0 };
    for (const c of conteosRaw) {
      if (c.estado in conteos) conteos[c.estado as keyof typeof conteos] = c._count.estado;
    }

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data: pagina.map(r => this.mapItem(r)),
      conteos,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async create(dto: CreateSolicitudProgramacionDto, usuarioId: string): Promise<SolicitudProgramacionItem> {
    const solicitud = await this.prisma.solicitudProgramacion.create({
      data: {
        fechaQx: dto.fechaQx ? new Date(dto.fechaQx) : null,
        horaQx: dto.horaQx ?? null,
        sedeId: dto.sedeId ?? null,
        hospitalId: dto.hospitalId ?? null,
        observaciones: dto.observaciones ?? null,
        consumo: dto.consumo ?? null,
        solicitanteId: usuarioId,
        medicos: { create: (dto.medicoIds ?? []).map(medicoId => ({ medicoId })) },
      },
      select: SOLICITUD_SELECT,
    });

    const item = this.mapItem(solicitud);

    const revisorIds = await this.getRevisorIds();
    await this.notificacionesService.crearParaVarios(revisorIds, {
      tipo: 'SOLICITUD_PROGRAMACION_PENDIENTE',
      titulo: 'Nueva solicitud de programación',
      mensaje: `${item.solicitante ?? 'Alguien'} solicitó una programación${item.hospital ? ` para ${item.hospital}` : ''}${item.fechaQx ? ` el ${item.fechaQx.toISOString().slice(0, 10)}` : ''}.`,
      link: '/operacion/solicitud-programacion',
    });

    return item;
  }

  async updateEstado(id: string, usuarioId: string, dto: UpdateEstadoSolicitudDto): Promise<SolicitudProgramacionItem> {
    if (dto.estado === 'RECHAZADA' && !dto.motivoRechazo?.trim()) {
      throw new BadRequestException('El motivo es obligatorio al rechazar una solicitud');
    }

    const esRevisor = await this.esRevisor(usuarioId);
    if (!esRevisor) {
      throw new BadRequestException('No tienes permiso para revisar solicitudes de programación');
    }

    const existente = await this.prisma.solicitudProgramacion.findUnique({
      where: { id },
      include: { medicos: true },
    });
    if (!existente) throw new NotFoundException('Solicitud no encontrada');
    if (existente.estado !== 'PENDIENTE') {
      throw new BadRequestException('Esta solicitud ya fue revisada');
    }

    let programacionId: string | undefined;
    if (dto.estado === 'APROBADA') {
      const programacion = await this.programacionesRepository.create(
        {
          fechaQx: existente.fechaQx ? existente.fechaQx.toISOString().slice(0, 10) : undefined,
          horaQx: existente.horaQx ?? undefined,
          sedeId: existente.sedeId ?? undefined,
          hospitalId: existente.hospitalId ?? undefined,
          observaciones: existente.observaciones ?? undefined,
          consumo: existente.consumo ?? undefined,
          medicoIds: existente.medicos.map(m => m.medicoId),
        },
        existente.solicitanteId ?? usuarioId,
      );
      programacionId = programacion.id;
    }

    const actualizada = await this.prisma.solicitudProgramacion.update({
      where: { id },
      data: {
        estado: dto.estado,
        motivoRechazo: dto.estado === 'RECHAZADA' ? dto.motivoRechazo!.trim() : null,
        revisorId: usuarioId,
        fechaRevision: new Date(),
        ...(programacionId ? { programacionId } : {}),
      },
      select: SOLICITUD_SELECT,
    });

    const item = this.mapItem(actualizada);

    if (existente.solicitanteId) {
      const aprobada = dto.estado === 'APROBADA';
      await this.notificacionesService.crear({
        usuarioId: existente.solicitanteId,
        tipo: aprobada ? 'SOLICITUD_PROGRAMACION_APROBADA' : 'SOLICITUD_PROGRAMACION_RECHAZADA',
        titulo: aprobada ? 'Tu solicitud de programación fue aprobada' : 'Tu solicitud de programación fue rechazada',
        mensaje: aprobada
          ? `La programación${item.hospital ? ` para ${item.hospital}` : ''} ya fue creada.`
          : `Motivo: ${item.motivoRechazo}`,
        link: aprobada && programacionId ? `/operacion/programaciones/${programacionId}` : '/operacion/solicitud-programacion?tab=RECHAZADA',
      });
    }

    return item;
  }
}
