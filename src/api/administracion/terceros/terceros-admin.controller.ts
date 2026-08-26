import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { SuperAdminOnly } from '@app/commons/decorators/super-admin-only.decorator';
import { TercerosAdminService } from './terceros-admin.service';
import { TerceroQueryDto } from './dto/tercero-query.dto';
import { CreateTerceroDto } from './dto/create-tercero.dto';
import { UpdateTerceroDto } from './dto/update-tercero.dto';
import { CreateTerceroContactoDto } from './dto/create-tercero-contacto.dto';
import { CreateTerceroCuentaDto } from './dto/create-tercero-cuenta.dto';
import { UpdateTerceroContactoDto } from './dto/update-tercero-contacto.dto';

@ApiTags('Administración - Terceros')
@ApiBearerAuth()
@SuperAdminOnly()
@Controller('administracion/terceros')
export class TercerosAdminController {
  constructor(private readonly service: TercerosAdminService) {}

  @Get()
  @ApiOperation({ summary: 'Listado de terceros (búsqueda por nombre/correo, filtro por clasificación, paginado)' })
  findAll(@Query() query: TerceroQueryDto) {
    return this.service.findAll(query);
  }

  @Get('catalogos')
  @ApiOperation({ summary: 'Catálogos usados por el formulario de terceros (cargos, ciudades, estados, países, régimen fiscal, uso CFDI, bancos)' })
  getCatalogos() {
    return this.service.getCatalogos();
  }

  @Post()
  @ApiOperation({ summary: 'Agregar un tercero' })
  @ApiCreatedResponse({ description: 'Tercero creado' })
  createTercero(@Body() dto: CreateTerceroDto, @Req() req: Request) {
    const user = req['user'] as { sub: string };
    return this.service.createTercero(dto, user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un tercero (datos principales, contactos, cuentas bancarias, clasificación)' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar un tercero (incluye desactivar, vía activo: false)' })
  updateTercero(@Param('id') id: string, @Body() dto: UpdateTerceroDto) {
    return this.service.updateTercero(id, dto);
  }

  @Post(':id/contactos')
  @ApiOperation({ summary: 'Agrega un dato de contacto a un tercero' })
  @ApiCreatedResponse({ description: 'Contacto creado' })
  createContacto(@Param('id') id: string, @Body() dto: CreateTerceroContactoDto) {
    return this.service.createContacto(id, dto);
  }

  @Post(':id/cuentas')
  @ApiOperation({ summary: 'Agrega una cuenta bancaria a un tercero' })
  @ApiCreatedResponse({ description: 'Cuenta creada' })
  createCuenta(@Param('id') id: string, @Body() dto: CreateTerceroCuentaDto) {
    return this.service.createCuenta(id, dto);
  }

  @Patch(':id/contactos/:contactoId')
  @ApiOperation({ summary: 'Edita un dato de contacto de un tercero' })
  updateContacto(@Param('id') id: string, @Param('contactoId') contactoId: string, @Body() dto: UpdateTerceroContactoDto) {
    return this.service.updateContacto(id, contactoId, dto);
  }

  @Delete(':id/contactos/:contactoId')
  @ApiOperation({ summary: 'Elimina un dato de contacto de un tercero' })
  deleteContacto(@Param('id') id: string, @Param('contactoId') contactoId: string) {
    return this.service.deleteContacto(id, contactoId);
  }

  @Delete(':id/cuentas/:cuentaId')
  @ApiOperation({ summary: 'Elimina una cuenta bancaria de un tercero' })
  deleteCuenta(@Param('id') id: string, @Param('cuentaId') cuentaId: string) {
    return this.service.deleteCuenta(id, cuentaId);
  }
}
