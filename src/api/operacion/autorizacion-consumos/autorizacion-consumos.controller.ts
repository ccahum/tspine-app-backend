import { Body, Controller, Get, Param, Patch, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AutorizacionConsumosService } from './autorizacion-consumos.service';
import { AutorizacionConsumoQueryDto } from './dto/autorizacion-consumo-query.dto';
import { UpdateEstadoAutorizacionDto } from './dto/update-estado-autorizacion.dto';

@ApiTags('Operación - Autorización de Consumos')
@ApiBearerAuth()
@Controller('operacion/autorizacion-consumos')
export class AutorizacionConsumosController {
  constructor(private readonly service: AutorizacionConsumosService) {}

  @Get()
  @ApiOperation({ summary: 'Listado de consumos a autorizar, agrupados por remisión, visibles para el usuario actual' })
  findAll(@Query() query: AutorizacionConsumoQueryDto, @Req() req: Request) {
    const user = req['user'] as { sub: string };
    return this.service.findAll(user.sub, query.estado, query.page, query.limit);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Aprobar o rechazar un consumo' })
  updateEstado(@Param('id') id: string, @Body() dto: UpdateEstadoAutorizacionDto, @Req() req: Request) {
    const user = req['user'] as { sub: string };
    return this.service.updateEstado(id, user.sub, dto);
  }
}
