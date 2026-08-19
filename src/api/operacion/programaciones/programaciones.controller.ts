import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ProgramacionesService } from './programaciones.service';
import { ProgramacionQueryDto } from './dto/programacion-query.dto';
import { ProgramacionListItemDto, ProgramacionListResponseDto } from './dto/programacion-response.dto';
import { ProgramacionStatsDto } from './dto/programacion-stats.dto';
import { UpdateFlagsDto } from './dto/update-flags.dto';
import { CreateProgramacionDto } from './dto/create-programacion.dto';
import { UpdateProgramacionDto } from './dto/update-programacion.dto';
import { ProgramacionComparisonResponseDto } from './dto/programacion-comparison.dto';

@ApiTags('Operación - Programaciones')
@ApiBearerAuth()
@Controller('operacion/programaciones')
export class ProgramacionesController {
  constructor(private readonly service: ProgramacionesService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas de programaciones' })
  @ApiOkResponse({ type: ProgramacionStatsDto })
  async getStats(@Query() query: ProgramacionQueryDto): Promise<ProgramacionStatsDto> {
    return this.service.getStats(query);
  }

  @Get('comparison/monthly')
  @ApiOperation({ summary: 'Comparativa de programaciones por mes y año' })
  @ApiOkResponse({ type: ProgramacionComparisonResponseDto })
  async getMonthComparison(): Promise<ProgramacionComparisonResponseDto> {
    return this.service.getMonthComparison();
  }

  @Get('sede-distribution/:year/:month')
  @ApiOperation({ summary: 'Distribución de programaciones por sede para un mes específico' })
  async getSedeDistributionByMonth(@Param('year') year: string, @Param('month') month: string) {
    return this.service.getSedeDistributionByMonth(Number.parseInt(year), Number.parseInt(month));
  }

  @Get()
  @ApiOperation({ summary: 'Listar programaciones' })
  @ApiOkResponse({ type: ProgramacionListResponseDto })
  async findAll(@Query() query: ProgramacionQueryDto): Promise<ProgramacionListResponseDto> {
    return this.service.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Crear nueva programación' })
  @ApiCreatedResponse({ type: ProgramacionListItemDto })
  async create(@Body() dto: CreateProgramacionDto, @Req() req: Request): Promise<ProgramacionListItemDto> {
    const user = req['user'] as { sub: string };
    return this.service.create(dto, user.sub);
  }

  @Get('sedes')
  @ApiOperation({ summary: 'Listar sedes (para el selector del formulario)' })
  async getSedes() {
    return this.service.getSedes();
  }

  @Get('hospitales')
  @ApiOperation({ summary: 'Listar hospitales (para el selector del formulario)' })
  async getHospitales() {
    return this.service.getHospitales();
  }

  @Get('medicos')
  @ApiOperation({ summary: 'Buscar médicos (Terceros clasificados como DOCTOR) por nombre' })
  async searchMedicos(@Query('search') search?: string) {
    return this.service.searchMedicos(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de una programación' })
  async getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Patch(':id/flags')
  @ApiOperation({ summary: 'Actualizar flags de una programación' })
  async updateFlags(@Param('id') id: string, @Body() dto: UpdateFlagsDto) {
    return this.service.updateFlags(id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar una programación existente' })
  async update(@Param('id') id: string, @Body() dto: UpdateProgramacionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una programación (solo si no tiene datos asociados)' })
  async delete(@Param('id') id: string) {
    await this.service.delete(id);
    return { success: true };
  }
}
