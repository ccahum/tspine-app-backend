import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@app/prisma/prisma.service';
import { esSuperAdminPerfil } from '@app/commons/authorization/super-admin.util';
import { ESTADOS_AUTORIZACION, EstadoAutorizacion } from './dto/autorizacion-consumo-query.dto';
import { UpdateEstadoAutorizacionDto } from './dto/update-estado-autorizacion.dto';

const VAL_CONSUMO_SELECT = {
  id: true,
  estadoAutorizacion: true,
  motivo: true,
  fechaAutorizacion: true,
  marcaTiempo: true,
  sedeConsumoId: true,
  sedeUsuarioId: true,
  sedeConsumo: { select: { nombre: true } },
  sedeUsuario: { select: { nombre: true } },
  producto: { select: { referencia: true, nombre: true } },
  lotes: { select: { cantidad: true } },
  remision: { select: { id: true, numRemision: true } },
  usuarioAutorizador: { select: { nombreCompleto: true } },
} as const;

type ValConsumoRegistro = {
  id: string;
  estadoAutorizacion: string | null;
  motivo: string | null;
  fechaAutorizacion: Date | null;
  marcaTiempo: Date | null;
  sedeConsumoId: string | null;
  sedeUsuarioId: string | null;
  sedeConsumo: { nombre: string | null } | null;
  sedeUsuario: { nombre: string | null } | null;
  producto: { referencia: string | null; nombre: string | null } | null;
  lotes: { cantidad: number | null }[];
  remision: { id: string; numRemision: string | null } | null;
  usuarioAutorizador: { nombreCompleto: string } | null;
};

export interface AutorizacionConsumoItem {
  id: string;
  sedeConsumo: string | null;
  sedeUsuario: string | null;
  canVal: number;
  proVal: string | null;
  estadoAutorizacion: string | null;
  motivo: string | null;
  fechaAutorizacion: Date | null;
  usuarioAutorizador: string | null;
}

export interface AutorizacionConsumoGrupo {
  remisionId: string | null;
  numRemision: string | null;
  items: AutorizacionConsumoItem[];
}

@Injectable()
export class AutorizacionConsumosService {
  constructor(private readonly prisma: PrismaService) {}

  private async getVisibilidad(usuarioId: string) {
    const usuario = await this.prisma.tercero.findUnique({
      where: { id: usuarioId },
      select: {
        perfilId: true,
        perfil: { select: { nombre: true } },
        sedesAutorizaciones: { select: { sedeId: true } },
      },
    });

    const esSuperAdmin = esSuperAdminPerfil(usuario);
    const sedesAutorizadas = new Set((usuario?.sedesAutorizaciones ?? []).map(s => s.sedeId));

    return { esSuperAdmin, sedesAutorizadas };
  }

  private puedeVer(
    registro: { sedeConsumoId: string | null; sedeUsuarioId: string | null },
    visibilidad: { esSuperAdmin: boolean; sedesAutorizadas: Set<string> },
  ) {
    if (visibilidad.esSuperAdmin) return true;
    if (registro.sedeConsumoId && visibilidad.sedesAutorizadas.has(registro.sedeConsumoId)) return true;
    if (registro.sedeConsumoId && registro.sedeConsumoId === registro.sedeUsuarioId) return true;
    return false;
  }

  private mapItem(r: ValConsumoRegistro): AutorizacionConsumoItem {
    const proVal = r.producto?.referencia && r.producto?.nombre
      ? `${r.producto.referencia} / ${r.producto.nombre}`
      : (r.producto?.nombre ?? r.producto?.referencia ?? null);

    return {
      id: r.id,
      sedeConsumo: r.sedeConsumo?.nombre ?? null,
      sedeUsuario: r.sedeUsuario?.nombre ?? null,
      canVal: r.lotes.reduce((sum, l) => sum + Number(l.cantidad ?? 0), 0),
      proVal,
      estadoAutorizacion: r.estadoAutorizacion,
      motivo: r.motivo,
      fechaAutorizacion: r.fechaAutorizacion,
      usuarioAutorizador: r.usuarioAutorizador?.nombreCompleto ?? null,
    };
  }

  async findAll(usuarioId: string, estado?: EstadoAutorizacion, page = 1, limit = 100) {
    const visibilidad = await this.getVisibilidad(usuarioId);

    const registros = await this.prisma.valConsumo.findMany({
      where: { eliminar: false, estadoAutorizacion: { in: [...ESTADOS_AUTORIZACION] } },
      select: VAL_CONSUMO_SELECT,
      orderBy: { marcaTiempo: 'desc' },
    });

    const visibles = registros.filter(r => this.puedeVer(r, visibilidad));

    const conteos = { PENDIENTE: 0, AUTORIZADO: 0, 'NO AUTORIZADO': 0 };
    for (const r of visibles) {
      if (r.estadoAutorizacion && r.estadoAutorizacion in conteos) {
        conteos[r.estadoAutorizacion as keyof typeof conteos]++;
      }
    }

    const filtrados = estado ? visibles.filter(r => r.estadoAutorizacion === estado) : visibles;

    const total = filtrados.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const pagina = filtrados.slice((page - 1) * limit, page * limit);

    const grupos = new Map<string, AutorizacionConsumoGrupo>();
    for (const r of pagina) {
      const key = r.remision?.id ?? 'sin-remision';
      if (!grupos.has(key)) {
        grupos.set(key, {
          remisionId: r.remision?.id ?? null,
          numRemision: r.remision?.numRemision ?? null,
          items: [],
        });
      }
      grupos.get(key)!.items.push(this.mapItem(r));
    }

    return { grupos: [...grupos.values()], conteos, page, limit, total, totalPages };
  }

  async updateEstado(id: string, usuarioId: string, dto: UpdateEstadoAutorizacionDto) {
    if (dto.estado === 'NO AUTORIZADO' && !dto.motivo?.trim()) {
      throw new BadRequestException('El motivo es obligatorio al rechazar un consumo');
    }

    const existente = await this.prisma.valConsumo.findUnique({ where: { id } });
    if (!existente) throw new NotFoundException('Consumo no encontrado');

    const visibilidad = await this.getVisibilidad(usuarioId);
    if (!this.puedeVer(existente, visibilidad)) {
      throw new BadRequestException('No tienes permiso para autorizar este consumo');
    }

    const actualizado = await this.prisma.valConsumo.update({
      where: { id },
      data: {
        estadoAutorizacion: dto.estado,
        motivo: dto.estado === 'NO AUTORIZADO' ? dto.motivo!.trim() : null,
        fechaAutorizacion: new Date(),
        usuarioAutorizadorId: usuarioId,
      },
      select: VAL_CONSUMO_SELECT,
    });

    return this.mapItem(actualizado);
  }
}
