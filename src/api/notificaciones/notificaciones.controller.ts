import { Controller, Get, Param, Patch, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { NotificacionesService } from '@app/shared/services/notificaciones.service';

@ApiTags('Notificaciones')
@ApiBearerAuth()
@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista las notificaciones del usuario actual, más recientes primero (paginado)' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  listar(@Req() req: Request, @Query('skip') skip?: string) {
    const user = req['user'] as { sub: string };
    return this.notificacionesService.listar(user.sub, undefined, skip ? Number(skip) : 0);
  }

  @Get('no-leidas-count')
  @ApiOperation({ summary: 'Cantidad de notificaciones no leídas del usuario actual' })
  async noLeidasCount(@Req() req: Request) {
    const user = req['user'] as { sub: string };
    const count = await this.notificacionesService.noLeidasCount(user.sub);
    return { count };
  }

  @Patch('leer-todas')
  @ApiOperation({ summary: 'Marca todas las notificaciones del usuario actual como leídas' })
  marcarTodasLeidas(@Req() req: Request) {
    const user = req['user'] as { sub: string };
    return this.notificacionesService.marcarTodasLeidas(user.sub);
  }

  @Patch(':id/leer')
  @ApiOperation({ summary: 'Marca una notificación como leída' })
  marcarLeida(@Param('id') id: string, @Req() req: Request) {
    const user = req['user'] as { sub: string };
    return this.notificacionesService.marcarLeida(id, user.sub);
  }
}
