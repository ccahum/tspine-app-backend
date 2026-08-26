import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, StreamableFile } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { VehiculoCatalogoService } from './vehiculo-catalogo.service';
import { VehiculoCatalogoQueryDto } from './dto/vehiculo-catalogo-query.dto';
import { CreateVehiculoCatalogoDto } from './dto/create-vehiculo-catalogo.dto';
import { UpdateVehiculoCatalogoDto } from './dto/update-vehiculo-catalogo.dto';

@ApiTags('Vehicular - Catálogo Vehicular')
@ApiBearerAuth()
@Controller('vehicular/catalogo')
export class VehiculoCatalogoController {
  constructor(private readonly service: VehiculoCatalogoService) {}

  @Get()
  @ApiOperation({ summary: 'Listado del catálogo vehicular (búsqueda por placas/nombre/marca, paginado)' })
  findAll(@Query() query: VehiculoCatalogoQueryDto) {
    return this.service.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Agregar un vehículo al catálogo' })
  @ApiCreatedResponse({ description: 'Vehículo creado' })
  createVehiculo(@Body() dto: CreateVehiculoCatalogoDto) {
    return this.service.createVehiculo(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar un vehículo del catálogo' })
  updateVehiculo(@Param('id') id: string, @Body() dto: UpdateVehiculoCatalogoDto) {
    return this.service.updateVehiculo(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un vehículo del catálogo' })
  deleteVehiculo(@Param('id') id: string) {
    return this.service.deleteVehiculo(id);
  }

  @Get(':id/foto')
  @ApiOperation({ summary: 'Descarga la fotografía de un vehículo del catálogo' })
  async getFoto(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const { path, mime } = await this.service.getFotoArchivo(id);
    res.set({ 'Content-Type': mime });
    return new StreamableFile(createReadStream(path));
  }
}
