import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ProgramacionQueryDto } from './dto/programacion-query.dto';
import { ProgramacionListItemDto, ProgramacionListResponseDto } from './dto/programacion-response.dto';
import { ProgramacionStatsDto } from './dto/programacion-stats.dto';
import { UpdateFlagsDto } from './dto/update-flags.dto';
import { CreateProgramacionDto } from './dto/create-programacion.dto';
import { UpdateProgramacionDto } from './dto/update-programacion.dto';
import { ProgramacionesRepositoryService } from '@app/shared/repositories/programaciones/programaciones.repository.service';
import { ProgramacionesStatsRepositoryService } from '@app/shared/repositories/programaciones/programaciones-stats.repository.service';
import { LoggerExtensions } from '@app/commons/logger.extensions';
import { ProgramacionComparisonResponseDto } from './dto/programacion-comparison.dto';

const computeSinRemision = (p: any): boolean => (p.remisiones?.length ?? 0) === 0;

const computeSinComision = (p: any): boolean =>
  (p._count?.detTecnicos ?? 0) === 0 && (p.remisiones ?? []).every((r: any) => (r._count?.detTecnicos ?? 0) === 0);

const computeConsumoNoValidado = (p: any): boolean =>
  (p.detConsumos?.length ?? 0) === 0 || (p.detConsumos ?? []).some((dc: any) => (dc._count?.valConsumos ?? 0) === 0);

@Injectable()
export class ProgramacionesService {
  private readonly logger = new Logger(ProgramacionesService.name);

  constructor(
    private readonly repository: ProgramacionesRepositoryService,
    private readonly statsRepository: ProgramacionesStatsRepositoryService,
  ) {}

  async findAll(query: ProgramacionQueryDto): Promise<ProgramacionListResponseDto> {
    LoggerExtensions.writeDebug(this.logger, 'Listando programaciones', { query });

    const { data, total } = await this.repository.findAll(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;

    const items: ProgramacionListItemDto[] = data.map((p: any) => ({
      id: p.id,
      fechaQx: p.fechaQx,
      horaQx: p.horaQx,
      sede: p.sede?.nombre ?? null,
      ciudad: p.hospital?.ciudadCat?.nombre ?? null,
      medicos: p.medicos.map((m: any) => m.medico.nombreCompleto),
      hospital: p.hospital?.nombre ?? null,
      observaciones: p.observaciones,
      avance: p.avance ? Number(p.avance) : null,
      sinRemision: computeSinRemision(p),
      consumoNoValidado: computeConsumoNoValidado(p),
      sinComision: computeSinComision(p),
      cerrada: p.switch,
    }));

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStats(query: ProgramacionQueryDto): Promise<ProgramacionStatsDto> {
    return this.statsRepository.getStats(query);
  }

  async getById(id: string) {
    const p = await this.repository.getById(id);
    if (!p) return null;
    return {
      ...p,
      sinRemision: computeSinRemision(p),
      consumoNoValidado: computeConsumoNoValidado(p),
      sinComision: computeSinComision(p),
      cerrada: (p as any).switch,
    };
  }

  async updateFlags(id: string, dto: UpdateFlagsDto): Promise<ProgramacionListItemDto> {
    if (dto.cerrada === true) {
      const { remisiones, requisiciones } = await this.repository.countRemisionesYRequisiciones(id);
      if (remisiones === 0 || requisiciones === 0) {
        throw new BadRequestException(
          'Para cerrar la programación, primero debe tener al menos una remisión y una requisición.',
        );
      }
    }

    const updated = await this.repository.updateFlags(id, dto as Record<string, boolean | undefined>);
    return {
      id: updated.id,
      fechaQx: updated.fechaQx,
      horaQx: updated.horaQx,
      sede: updated.sede?.nombre ?? null,
      ciudad: updated.hospital?.ciudadCat?.nombre ?? null,
      medicos: updated.medicos.map((m: any) => m.medico.nombreCompleto),
      hospital: updated.hospital?.nombre ?? null,
      observaciones: updated.observaciones,
      avance: updated.avance ? Number(updated.avance) : null,
      sinRemision: computeSinRemision(updated),
      consumoNoValidado: computeConsumoNoValidado(updated),
      sinComision: computeSinComision(updated),
      cerrada: !!updated.switch,
    };
  }

  async delete(id: string): Promise<void> {
    const counts = await this.repository.countRelatedData(id);
    if (!counts) {
      throw new NotFoundException('Programación no encontrada.');
    }

    const blockers: string[] = [];
    if (counts.remisiones > 0) blockers.push(`${counts.remisiones} remisión(es)`);
    if (counts.requisiciones > 0) blockers.push(`${counts.requisiciones} requisición(es)`);
    if (counts.detConsumos > 0) blockers.push(`${counts.detConsumos} consumo(s)`);
    if (counts.detTecnicos > 0) blockers.push(`${counts.detTecnicos} comisión(es)`);
    if (counts.valConsumos > 0) blockers.push(`${counts.valConsumos} validación(es) de consumo`);
    if (counts.detTecnicoDetalles > 0) blockers.push(`${counts.detTecnicoDetalles} detalle(s) de comisión`);
    if (counts.remTecnicos > 0) blockers.push(`${counts.remTecnicos} técnico(s) en remisión`);
    if (counts.gastos > 0) blockers.push(`${counts.gastos} gasto(s)`);
    if (counts.fuentes > 0) blockers.push(`${counts.fuentes} fuente(s)`);
    if (counts.documentos > 0) blockers.push(`${counts.documentos} documento(s)`);
    if (counts.tecnicosSugeridos > 0) blockers.push(`${counts.tecnicosSugeridos} técnico(s) sugerido(s)`);

    if (blockers.length > 0) {
      throw new BadRequestException(
        `No se puede eliminar: la programación tiene ${blockers.join(', ')}.`,
      );
    }

    LoggerExtensions.writeDebug(this.logger, 'Eliminando programación', { id });
    await this.repository.delete(id);
  }

  async create(dto: CreateProgramacionDto, usuarioId: string): Promise<ProgramacionListItemDto> {
    LoggerExtensions.writeDebug(this.logger, 'Creando programación', { dto });

    const created = await this.repository.create(dto, usuarioId);
    return {
      id: created.id,
      fechaQx: created.fechaQx,
      horaQx: created.horaQx,
      sede: created.sede?.nombre ?? null,
      ciudad: created.hospital?.ciudadCat?.nombre ?? null,
      medicos: created.medicos.map((m: any) => m.medico.nombreCompleto),
      hospital: created.hospital?.nombre ?? null,
      observaciones: created.observaciones,
      avance: created.avance ? Number(created.avance) : null,
      sinRemision: true,
      consumoNoValidado: true,
      sinComision: true,
      cerrada: !!created.switch,
    };
  }

  async update(id: string, dto: UpdateProgramacionDto): Promise<ProgramacionListItemDto> {
    LoggerExtensions.writeDebug(this.logger, 'Actualizando programación', { id, dto });

    const updated = await this.repository.update(id, dto);
    return {
      id: updated.id,
      fechaQx: updated.fechaQx,
      horaQx: updated.horaQx,
      sede: updated.sede?.nombre ?? null,
      ciudad: updated.hospital?.ciudadCat?.nombre ?? null,
      medicos: updated.medicos.map((m: any) => m.medico.nombreCompleto),
      hospital: updated.hospital?.nombre ?? null,
      observaciones: updated.observaciones,
      avance: updated.avance ? Number(updated.avance) : null,
      sinRemision: computeSinRemision(updated),
      consumoNoValidado: computeConsumoNoValidado(updated),
      sinComision: computeSinComision(updated),
      cerrada: !!updated.switch,
    };
  }

  getSedes() {
    return this.repository.getSedes();
  }

  getHospitales() {
    return this.repository.getHospitales();
  }

  searchMedicos(search?: string) {
    return this.repository.searchMedicos(search);
  }

  async getMonthComparison(): Promise<ProgramacionComparisonResponseDto> {
    LoggerExtensions.writeDebug(this.logger, 'Obteniendo comparativa de programaciones por mes y año', {});

    const data = await this.repository.getMonthComparison();
    return { data };
  }

  async getSedeDistributionByMonth(year: number, month: number) {
    LoggerExtensions.writeDebug(this.logger, 'Obteniendo distribución de programaciones por sede para mes', { year, month });

    const data = await this.repository.getSedeDistributionByMonth(year, month);
    return { data };
  }
}
