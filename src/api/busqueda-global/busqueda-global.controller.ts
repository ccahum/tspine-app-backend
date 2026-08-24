import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BusquedaGlobalService } from './busqueda-global.service';

@ApiTags('Búsqueda Global')
@Controller('busqueda-global')
export class BusquedaGlobalController {
  constructor(private readonly busquedaGlobalService: BusquedaGlobalService) {}

  @Get()
  @ApiOperation({ summary: 'Busca programaciones, remisiones y técnicos por texto libre (buscador del header)' })
  buscar(@Query('q') q?: string) {
    return this.busquedaGlobalService.buscar(q);
  }
}
