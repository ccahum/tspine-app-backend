import { Body, Controller, Get, Param, Post, Query, Req, Res, StreamableFile } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { createReadStream } from 'fs';
import { ViajeVehiculoService } from './viaje-vehiculo.service';
import { ViajeVehiculoQueryDto } from './dto/viaje-vehiculo-query.dto';
import { CreateViajeVehiculoDto } from './dto/create-viaje-vehiculo.dto';

@ApiTags('Vehicular - Control de Viajes')
@ApiBearerAuth()
@Controller('vehicular/viajes')
export class ViajeVehiculoController {
  constructor(private readonly service: ViajeVehiculoService) {}

  @Get()
  @ApiOperation({ summary: 'Listado de viajes de la flotilla (búsqueda por conductor/placas/diligencia, paginado)' })
  findAll(@Query() query: ViajeVehiculoQueryDto) {
    return this.service.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Agrega un viaje — el conductor es el usuario autenticado' })
  @ApiCreatedResponse({ description: 'Viaje creado' })
  createViaje(@Body() dto: CreateViajeVehiculoDto, @Req() req: Request) {
    const user = req['user'] as { sub: string };
    return this.service.createViaje(dto, user.sub);
  }

  @Get(':id/foto')
  @ApiOperation({ summary: 'Descarga la foto del tablero de un viaje' })
  async getFoto(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const { path, mime } = await this.service.getFotoArchivo(id);
    res.set({ 'Content-Type': mime });
    return new StreamableFile(createReadStream(path));
  }
}
