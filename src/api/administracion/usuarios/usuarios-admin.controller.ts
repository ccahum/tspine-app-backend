import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SuperAdminOnly } from '@app/commons/decorators/super-admin-only.decorator';
import { UsuariosAdminService } from './usuarios-admin.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { PerfilOptionDto, UsuarioAdminItemDto } from './dto/usuario-admin-response.dto';

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

  @Post()
  @ApiOperation({ summary: 'Crear un usuario nuevo' })
  @ApiOkResponse({ type: UsuarioAdminItemDto })
  create(@Body() dto: CreateUsuarioDto): Promise<UsuarioAdminItemDto> {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar un usuario existente (perfil, sede, activo, reset de contraseña)' })
  @ApiOkResponse({ type: UsuarioAdminItemDto })
  update(@Param('id') id: string, @Body() dto: UpdateUsuarioDto): Promise<UsuarioAdminItemDto> {
    return this.service.update(id, dto);
  }
}
