import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CotizacionesService } from './cotizaciones.service';
import { CotizacionQueryDto } from './dto/cotizacion-query.dto';
import { CreateDetCotizaDto } from './dto/create-det-cotiza.dto';
import { UpdateDetCotizaDto } from './dto/update-det-cotiza.dto';
import { UpdateCotizacionDto } from './dto/update-cotizacion.dto';
import { CreateCotizacionDto } from './dto/create-cotizacion.dto';

@ApiTags('Operación - Cotizaciones')
@ApiBearerAuth()
@Controller('operacion/cotizaciones')
export class CotizacionesController {
  constructor(private readonly service: CotizacionesService) {}

  @Get()
  @ApiOperation({ summary: 'Listado de cotizaciones (búsqueda, filtro por fecha/status, paginado)' })
  findAll(@Query() query: CotizacionQueryDto) {
    return this.service.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Crear una nueva cotización' })
  @ApiCreatedResponse({ description: 'Cotización creada' })
  createCotizacion(@Body() dto: CreateCotizacionDto, @Req() req: Request) {
    const user = req['user'] as { sub: string } | undefined;
    return this.service.createCotizacion(dto, user?.sub);
  }

  @Get('productos')
  @ApiOperation({ summary: 'Buscar Productos por nombre, para agregar un ítem a una cotización (incluye precio sugerido según la tarifa de la cotización)' })
  searchProductos(@Query('search') search?: string, @Query('cotizacionId') cotizacionId?: string) {
    return this.service.searchProductos(search, cotizacionId);
  }

  @Get('terceros')
  @ApiOperation({ summary: 'Buscar Terceros por nombre, para Hospital/Empresa/Responsable Económico (clasificacion opcional filtra por ej. EMPRESA, PARTICULAR, HOSPITAL, DISTRIBUIDOR, ASEGURADORA)' })
  searchTerceros(@Query('search') search?: string, @Query('clasificacion') clasificacion?: string) {
    return this.service.searchTerceros(search, clasificacion);
  }

  @Get('tarifas')
  @ApiOperation({ summary: 'Listado de subtarifas, para el campo Tarifa' })
  getTarifas() {
    return this.service.getTarifas();
  }

  @Get('paquetes')
  @ApiOperation({ summary: 'Listado de paquetes de cotización, para el campo Paquete' })
  getPaquetes() {
    return this.service.getPaquetes();
  }

  @Patch('items/:itemId')
  @ApiOperation({ summary: 'Editar un ítem (Det_Cotiza): producto, cantidad y valor unitario (el valor se recalcula en el servidor)' })
  updateItem(@Param('itemId') itemId: string, @Body() dto: UpdateDetCotizaDto) {
    return this.service.updateItem(itemId, dto);
  }

  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Eliminar un ítem (Det_Cotiza)' })
  deleteItem(@Param('itemId') itemId: string) {
    return this.service.deleteItem(itemId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una cotización (ítems y remisiones asociadas incluidas)' })
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar una cotización' })
  updateCotizacion(@Param('id') id: string, @Body() dto: UpdateCotizacionDto) {
    return this.service.updateCotizacion(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una cotización' })
  deleteCotizacion(@Param('id') id: string) {
    return this.service.deleteCotizacion(id);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Agregar un ítem (Det_Cotiza) a una cotización' })
  @ApiCreatedResponse({ description: 'Ítem creado' })
  createItem(@Param('id') id: string, @Body() dto: CreateDetCotizaDto, @Req() req: Request) {
    const user = req['user'] as { sub: string } | undefined;
    return this.service.createItem(id, dto, user?.sub);
  }
}
