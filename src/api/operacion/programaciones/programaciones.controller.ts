import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProgramacionesService } from './programaciones.service';
import { ProgramacionQueryDto } from './dto/programacion-query.dto';
import { ProgramacionListItemDto, ProgramacionListResponseDto } from './dto/programacion-response.dto';
import { ProgramacionStatsDto } from './dto/programacion-stats.dto';
import { UpdateFlagsDto } from './dto/update-flags.dto';
import { CreateProgramacionDto } from './dto/create-programacion.dto';
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
  async create(@Body() dto: CreateProgramacionDto): Promise<ProgramacionListItemDto> {
    return this.service.create(dto);
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
}
