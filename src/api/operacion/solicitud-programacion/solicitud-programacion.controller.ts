import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { SolicitudProgramacionService } from './solicitud-programacion.service';
import { CreateSolicitudProgramacionDto } from './dto/create-solicitud-programacion.dto';
import { UpdateEstadoSolicitudDto } from './dto/update-estado-solicitud.dto';
import { SolicitudProgramacionQueryDto } from './dto/solicitud-programacion-query.dto';

@ApiTags('Operación - Solicitud de Programación')
@ApiBearerAuth()
@Controller('operacion/solicitud-programacion')
export class SolicitudProgramacionController {
  constructor(private readonly service: SolicitudProgramacionService) {}

  @Get()
  @ApiOperation({ summary: 'Listado de solicitudes de programación (revisores ven todas, el resto solo las propias)' })
  findAll(@Query() query: SolicitudProgramacionQueryDto, @Req() req: Request) {
    const user = req['user'] as { sub: string };
    return this.service.findAll(user.sub, query.estado, query.page, query.limit);
  }

  @Get('soy-revisor')
  @ApiOperation({ summary: 'Indica si el usuario actual puede revisar (aprobar/rechazar) solicitudes' })
  async soyRevisor(@Req() req: Request) {
    const user = req['user'] as { sub: string };
    const esRevisor = await this.service.esRevisor(user.sub);
    return { esRevisor };
  }

  @Post()
  @ApiOperation({ summary: 'Crea una nueva solicitud de programación' })
  create(@Body() dto: CreateSolicitudProgramacionDto, @Req() req: Request) {
    const user = req['user'] as { sub: string };
    return this.service.create(dto, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Aprueba o rechaza una solicitud de programación' })
  updateEstado(@Param('id') id: string, @Body() dto: UpdateEstadoSolicitudDto, @Req() req: Request) {
    const user = req['user'] as { sub: string };
    return this.service.updateEstado(id, user.sub, dto);
  }
}
