import { BadRequestException, Injectable } from '@nestjs/common';
import { RemisionesRepositoryService } from '@app/shared/repositories/remisiones/remisiones.repository.service';
import { RemisionQueryDto } from './dto/remision-query.dto';
import { CreateComisionDto } from './dto/create-comision.dto';
import { CreateRequisicionDto } from './dto/create-requisicion.dto';
import { UpdateRequisicionDto } from './dto/update-requisicion.dto';
import { CreateDetRequisicionDto } from './dto/create-det-requisicion.dto';
import { UpdateDetRequisicionDto } from './dto/update-det-requisicion.dto';
import { CreateRemisionDto } from './dto/create-remision.dto';
import { UpdateRemisionDto } from './dto/update-remision.dto';
import { CreateTecnicoSugeridoDto } from './dto/create-tecnico-sugerido.dto';

@Injectable()
export class RemisionesService {
  constructor(private readonly repo: RemisionesRepositoryService) {}

  getCxcStats() {
    return this.repo.getCxcStats();
  }

  createComision(dto: CreateComisionDto) {
    return this.repo.createComision(dto);
  }

  searchTecnicos(search?: string) {
    return this.repo.searchTecnicos(search);
  }

  searchEmpresas(search?: string) {
    return this.repo.searchEmpresas(search);
  }

  getEmpresaSugerida(cubrimientoId?: string, sedeId?: string) {
    return this.repo.getEmpresaSugerida(cubrimientoId, sedeId);
  }

  searchTecnicosComisionistas(search?: string) {
    return this.repo.searchTecnicosComisionistas(search);
  }

  findTecnicosSugeridosByProgramacion(programacionId: string) {
    return this.repo.findTecnicosSugeridosByProgramacion(programacionId);
  }

  createTecnicoSugerido(dto: CreateTecnicoSugeridoDto, usuarioId: string) {
    return this.repo.createTecnicoSugerido(dto, usuarioId);
  }

  deleteTecnicoSugerido(id: string) {
    return this.repo.deleteTecnicoSugerido(id);
  }

  async findAll(query: RemisionQueryDto) {
    const { data, total } = await this.repo.findAll(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;

    const items = data.map((r: any) => ({
      id: r.id,
      numRemision: r.numRemision,
      estado: r.estado,
      creadoEn: r.creadoEn,
      paciente: r.paciente,
      programacionId: r.programacion?.id ?? null,
      numProgram: r.programacion?.numProgram ?? null,
      fechaQx: r.programacion?.fechaQx ?? null,
      horaQx: r.programacion?.horaQx ?? null,
      sede: r.programacion?.sede?.nombre ?? null,
      ciudad: r.programacion?.hospital?.ciudadCat?.nombre ?? null,
      hospital: r.programacion?.hospital?.nombre ?? null,
      tarifa: r.tarifa?.nombre ?? null,
      empresa: r.empresa?.nombreCompleto ?? null,
      medicos: (r.programacion?.medicos ?? []).map((m: any) => m.medico.nombreCompleto),
    }));

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  findByProgramacion(programacionId: string) {
    return this.repo.findByProgramacion(programacionId);
  }

  updateEstado(id: string, estado: string) {
    return this.repo.updateEstado(id, estado);
  }

  findTecnicosByProgramacion(programacionId: string) {
    return this.repo.findTecnicosByProgramacion(programacionId);
  }

  findConsumosByProgramacion(programacionId: string) {
    return this.repo.findConsumosByProgramacion(programacionId);
  }

  getConsumoDetalle(id: string) {
    return this.repo.getConsumoDetalle(id);
  }

  getValConsumoDetalle(id: string) {
    return this.repo.getValConsumoDetalle(id);
  }

  getDetTecnicoDetalle(id: string) {
    return this.repo.getDetTecnicoDetalle(id);
  }

  findValidacionConsumosByProgramacion(programacionId: string) {
    return this.repo.findValidacionConsumosByProgramacion(programacionId);
  }

  findComisionesByProgramacion(programacionId: string) {
    return this.repo.findComisionesByProgramacion(programacionId);
  }

  findRequisicionesByProgramacion(programacionId: string) {
    return this.repo.findRequisicionesByProgramacion(programacionId);
  }

  getRequisicionDetalle(id: string) {
    return this.repo.getRequisicionDetalle(id);
  }

  updateRequisicion(id: string, dto: UpdateRequisicionDto) {
    return this.repo.updateRequisicion(id, dto);
  }

  deleteRequisicion(id: string) {
    return this.repo.deleteRequisicion(id);
  }

  findCubrimientos() {
    return this.repo.findCubrimientos();
  }

  findTarifasByCubrimiento(cubrimientoId: string) {
    return this.repo.findTarifasByCubrimiento(cubrimientoId);
  }

  createRequisicion(dto: CreateRequisicionDto, usuarioId: string) {
    return this.repo.createRequisicion(dto, usuarioId);
  }

  async createRemision(dto: CreateRemisionDto, usuarioId: string) {
    const requisiciones = await this.repo.countRequisicionesByProgramacion(dto.programacionId);
    if (requisiciones === 0) {
      throw new BadRequestException('Para agregar una remisión, primero debe existir al menos una requisición en la programación.');
    }
    return this.repo.createRemision(dto, usuarioId);
  }

  findDetallesByRequisicion(requisicionId: string) {
    return this.repo.findDetallesByRequisicion(requisicionId);
  }

  updateDetRequisicion(id: string, dto: UpdateDetRequisicionDto) {
    return this.repo.updateDetRequisicion(id, dto);
  }

  searchLotes(search?: string) {
    return this.repo.searchLotes(search);
  }

  searchProductos(search?: string) {
    return this.repo.searchProductos(search);
  }

  createDetRequisicion(dto: CreateDetRequisicionDto) {
    return this.repo.createDetRequisicion(dto);
  }

  findNotasCreditoByProgramacion(programacionId: string) {
    return this.repo.findNotasCreditoByProgramacion(programacionId);
  }

  findGastosByProgramacion(programacionId: string) {
    return this.repo.findGastosByProgramacion(programacionId);
  }

  findFuentesByProgramacion(programacionId: string) {
    return this.repo.findFuentesByProgramacion(programacionId);
  }

  findDocumentosByProgramacion(programacionId: string) {
    return this.repo.findDocumentosByProgramacion(programacionId);
  }

  getById(id: string) {
    return this.repo.getById(id);
  }

  updateRemision(id: string, dto: UpdateRemisionDto) {
    return this.repo.updateRemision(id, dto);
  }

  deleteRemision(id: string) {
    return this.repo.deleteRemision(id);
  }
}
