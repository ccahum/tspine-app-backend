import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CotizacionesService } from './cotizaciones.service';
import { CotizacionQueryDto } from './dto/cotizacion-query.dto';
import { CreateDetCotizaDto } from './dto/create-det-cotiza.dto';
import { UpdateDetCotizaDto } from './dto/update-det-cotiza.dto';
import { UpdateCotizacionDto } from './dto/update-cotizacion.dto';
import { CreateCotizacionDto } from './dto/create-cotizacion.dto';
import { RecalcularPreciosDto } from './dto/recalcular-precios.dto';
import { PreciosPorProductosDto } from './dto/precios-por-productos.dto';

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
  @ApiOperation({ summary: 'Buscar Productos por nombre, para agregar un ítem a una cotización (incluye precio sugerido según la tarifa de la cotización, o de tarifaId si aún no existe la cotización)' })
  searchProductos(@Query('search') search?: string, @Query('cotizacionId') cotizacionId?: string, @Query('tarifaId') tarifaId?: string) {
    return this.service.searchProductos(search, cotizacionId, tarifaId);
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

  @Get('sedes')
  @ApiOperation({ summary: 'Listado de sedes, para el campo Sede' })
  getSedes() {
    return this.service.getSedes();
  }

  @Get('tercero-tarifa/:id')
  @ApiOperation({ summary: 'Tarifa y sede propias de un Tercero (ej. hospital), para autocompletar los campos Tarifa y Sede' })
  getTerceroTarifa(@Param('id') id: string) {
    return this.service.getTerceroTarifa(id);
  }

  @Get('paquetes')
  @ApiOperation({ summary: 'Listado de paquetes de cotización, para el campo Paquete' })
  getPaquetes() {
    return this.service.getPaquetes();
  }

  @Get('paquetes/:paqueteId/consumos')
  @ApiOperation({ summary: 'Productos y cantidades definidos en un paquete para el nivel indicado (1 a 6), con precio sugerido según tarifa' })
  getPaqueteConsumos(@Param('paqueteId') paqueteId: string, @Query('nivel') nivel: string, @Query('tarifaId') tarifaId?: string) {
    return this.service.getPaqueteConsumos(paqueteId, nivel, tarifaId);
  }

  @Post('productos/precios')
  @ApiOperation({ summary: 'Precio de una lista de productos según una tarifa — para recalcular los consumos armados en memoria en Nueva Cotización cuando cambia la tarifa' })
  getPreciosPorProductos(@Body() dto: PreciosPorProductosDto) {
    return this.service.getPreciosPorProductos(dto.productoIds, dto.tarifaId);
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

  @Patch(':id/recalcular-precios')
  @ApiOperation({ summary: 'Recalcular el valor unitario/valor de los ítems ya agregados según la lista de precios de una nueva tarifa (ej. al cambiar el Cubrimiento o Responsable Económico en edición)' })
  recalcularPrecios(@Param('id') id: string, @Body() dto: RecalcularPreciosDto) {
    return this.service.recalcularPrecios(id, dto.tarifaId);
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
