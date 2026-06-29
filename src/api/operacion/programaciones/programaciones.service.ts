import { Injectable, Logger } from '@nestjs/common';
import { ProgramacionQueryDto } from './dto/programacion-query.dto';
import { ProgramacionListItemDto, ProgramacionListResponseDto } from './dto/programacion-response.dto';
import { ProgramacionStatsDto } from './dto/programacion-stats.dto';
import { UpdateFlagsDto } from './dto/update-flags.dto';
import { CreateProgramacionDto } from './dto/create-programacion.dto';
import { ProgramacionesRepositoryService } from '@app/shared/repositories/programaciones/programaciones.repository.service';
import { ProgramacionesStatsRepositoryService } from '@app/shared/repositories/programaciones/programaciones-stats.repository.service';
import { LoggerExtensions } from '@app/commons/logger.extensions';
import { ProgramacionComparisonResponseDto } from './dto/programacion-comparison.dto';

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
      idLegacy: p.idLegacy,
      fechaQx: p.fechaQx,
      horaQx: p.horaQx,
      sede: p.sede?.nombre ?? null,
      ciudad: p.hospital?.ciudad ?? null,
      medicos: p.medicos.map((m: any) => m.medico.nombreCompleto),
      hospital: p.hospital?.nombre ?? null,
      observaciones: p.observaciones,
      avance: p.avance ? Number(p.avance) : null,
      sinRemision: p.sinRemision,
      consumoNoValidado: p.consumoNoValidado,
      sinComision: p.sinComision,
      cerrada: p.cerrada,
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
    return this.repository.getById(id);
  }

  async updateFlags(id: string, dto: UpdateFlagsDto): Promise<ProgramacionListItemDto> {
    const updated = await this.repository.updateFlags(id, dto as Record<string, boolean | undefined>);
    return {
      id: updated.id,
      idLegacy: updated.idLegacy,
      fechaQx: updated.fechaQx,
      horaQx: updated.horaQx,
      sede: updated.sede?.nombre ?? null,
      ciudad: updated.hospital?.ciudad ?? null,
      medicos: updated.medicos.map((m: any) => m.medico.nombreCompleto),
      hospital: updated.hospital?.nombre ?? null,
      observaciones: updated.observaciones,
      avance: updated.avance ? Number(updated.avance) : null,
      sinRemision: updated.sinRemision,
      consumoNoValidado: updated.consumoNoValidado,
      sinComision: updated.sinComision,
      cerrada: updated.cerrada,
    };
  }

  async create(dto: CreateProgramacionDto): Promise<ProgramacionListItemDto> {
    LoggerExtensions.writeDebug(this.logger, 'Creando programación', { dto });

    const created = await this.repository.create(dto);
    return {
      id: created.id,
      idLegacy: created.idLegacy,
      fechaQx: created.fechaQx,
      horaQx: created.horaQx,
      sede: created.sede?.nombre ?? null,
      ciudad: created.hospital?.ciudad ?? null,
      medicos: created.medicos.map((m: any) => m.medico.nombreCompleto),
      hospital: created.hospital?.nombre ?? null,
      observaciones: created.observaciones,
      avance: created.avance ? Number(created.avance) : null,
      sinRemision: created.sinRemision,
      consumoNoValidado: created.consumoNoValidado,
      sinComision: created.sinComision,
      cerrada: created.cerrada,
    };
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
