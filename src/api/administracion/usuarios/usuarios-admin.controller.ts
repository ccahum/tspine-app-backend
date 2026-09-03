import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SuperAdminOnly } from '@app/commons/decorators/super-admin-only.decorator';
import { UsuariosAdminService } from './usuarios-admin.service';
import { CreateUsuarioDesdeTerceroDto } from './dto/create-usuario-desde-tercero.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { PerfilOptionDto, TerceroDisponibleDto, UsuarioAdminItemDto } from './dto/usuario-admin-response.dto';

@ApiTags('Administración - Usuarios')
@ApiBearerAuth()
@SuperAdminOnly()
@Controller('administracion/usuarios')
export class UsuariosAdminController {
  constructor(private readonly service: UsuariosAdminService) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuarios del sistema' })
  @ApiOkResponse({ type: [UsuarioAdminItemDto] })
  findAll(): Promise<UsuarioAdminItemDto[]> {
    return this.service.findAll();
  }

  @Get('perfiles')
  @ApiOperation({ summary: 'Listar perfiles disponibles (para el selector del formulario)' })
  @ApiOkResponse({ type: [PerfilOptionDto] })
  findPerfiles(): Promise<PerfilOptionDto[]> {
    return this.service.findPerfiles();
  }

  @Get('terceros-disponibles')
  @ApiOperation({ summary: 'Buscar Terceros con clasificación Empleado que aún no tienen cuenta de usuario' })
  @ApiOkResponse({ type: [TerceroDisponibleDto] })
  findTercerosDisponibles(@Query('q') q?: string): Promise<TerceroDisponibleDto[]> {
    return this.service.findTercerosDisponibles(q);
  }

  @Post('desde-tercero')
  @ApiOperation({ summary: 'Dar acceso de usuario a un Tercero (Empleado) que ya existe, sin duplicarlo' })
  @ApiOkResponse({ type: UsuarioAdminItemDto })
  createFromTercero(@Body() dto: CreateUsuarioDesdeTerceroDto): Promise<UsuarioAdminItemDto> {
    return this.service.createFromTercero(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar un usuario existente (perfil, sede, activo, reset de contraseña)' })
  @ApiOkResponse({ type: UsuarioAdminItemDto })
  update(@Param('id') id: string, @Body() dto: UpdateUsuarioDto): Promise<UsuarioAdminItemDto> {
    return this.service.update(id, dto);
  }
}
