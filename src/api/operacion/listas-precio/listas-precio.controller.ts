import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListasPrecioService } from './listas-precio.service';
import { ListaPrecioQueryDto } from './dto/lista-precio-query.dto';
import { UpdateListaPrecioDto } from './dto/update-lista-precio.dto';
import { CreateListaPrecioDto } from './dto/create-lista-precio.dto';

@ApiTags('Operación - Listas de Precio')
@ApiBearerAuth()
@Controller('operacion/listas-precio')
export class ListasPrecioController {
  constructor(private readonly service: ListasPrecioService) {}

  @Get()
  @ApiOperation({ summary: 'Listado de listas de precio (búsqueda por producto/subtarifa, paginado)' })
  findAll(@Query() query: ListaPrecioQueryDto) {
    return this.service.findAll(query);
  }

  @Get('subtarifas')
  @ApiOperation({ summary: 'Buscar Subtarifas por nombre, para el campo Subtarifa' })
  searchSubtarifas(@Query('search') search?: string) {
    return this.service.searchSubtarifas(search);
  }

  @Get('productos')
  @ApiOperation({ summary: 'Buscar Productos por nombre, para el campo Producto' })
  searchProductos(@Query('search') search?: string) {
    return this.service.searchProductos(search);
  }

  @Post()
  @ApiOperation({ summary: 'Crear una nueva lista de precio' })
  @ApiCreatedResponse({ description: 'Lista de precio creada' })
  createListaPrecio(@Body() dto: CreateListaPrecioDto) {
    return this.service.createListaPrecio(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar una lista de precio' })
  updateListaPrecio(@Param('id') id: string, @Body() dto: UpdateListaPrecioDto) {
    return this.service.updateListaPrecio(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una lista de precio' })
  deleteListaPrecio(@Param('id') id: string) {
    return this.service.deleteListaPrecio(id);
  }
}
