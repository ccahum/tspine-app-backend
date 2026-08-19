import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PreciosEspecialesService } from './precios-especiales.service';
import { PrecioEspecialQueryDto } from './dto/precio-especial-query.dto';
import { CreatePrecioEspecialDto } from './dto/create-precio-especial.dto';
import { UpdatePrecioEspecialDto } from './dto/update-precio-especial.dto';

@ApiTags('Operación - Precios Especiales')
@ApiBearerAuth()
@Controller('operacion/precios-especiales')
export class PreciosEspecialesController {
  constructor(private readonly service: PreciosEspecialesService) {}

  @Get()
  @ApiOperation({ summary: 'Listado de precios especiales (búsqueda por producto/contacto, paginado)' })
  findAll(@Query() query: PrecioEspecialQueryDto) {
    return this.service.findAll(query);
  }

  @Get('productos')
  @ApiOperation({ summary: 'Buscar Productos por nombre, para el campo Producto' })
  searchProductos(@Query('search') search?: string) {
    return this.service.searchProductos(search);
  }

  @Get('contactos')
  @ApiOperation({ summary: 'Buscar Terceros por nombre, para el campo Contacto' })
  searchContactos(@Query('search') search?: string) {
    return this.service.searchContactos(search);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo precio especial' })
  @ApiCreatedResponse({ description: 'Precio especial creado' })
  createPrecioEspecial(@Body() dto: CreatePrecioEspecialDto) {
    return this.service.createPrecioEspecial(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar un precio especial' })
  updatePrecioEspecial(@Param('id') id: string, @Body() dto: UpdatePrecioEspecialDto) {
    return this.service.updatePrecioEspecial(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un precio especial' })
  deletePrecioEspecial(@Param('id') id: string) {
    return this.service.deletePrecioEspecial(id);
  }
}
