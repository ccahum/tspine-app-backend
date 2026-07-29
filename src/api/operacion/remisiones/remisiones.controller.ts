import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RemisionesService } from './remisiones.service';

@ApiTags('Operación - Remisiones')
@ApiBearerAuth()
@Controller('operacion/remisiones')
export class RemisionesController {
  constructor(private readonly service: RemisionesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar remisiones de una programación' })
  @ApiQuery({ name: 'programacionId', required: true })
  @ApiOkResponse({ description: 'Remisiones de la programación' })
  findByProgramacion(@Query('programacionId') programacionId: string) {
    return this.service.findByProgramacion(programacionId);
  }

  @Get('tecnicos')
  @ApiOperation({ summary: 'Técnicos asociados a una programación (Rem_Técnicos)' })
  @ApiQuery({ name: 'programacionId', required: true })
  findTecnicosByProgramacion(@Query('programacionId') programacionId: string) {
    return this.service.findTecnicosByProgramacion(programacionId);
  }
}
