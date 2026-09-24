import { Body, Controller, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SuperAdminOnly } from '@app/commons/decorators/super-admin-only.decorator';
import { PerfilesAdminService } from './perfiles-admin.service';
import { CreatePerfilDto } from './dto/create-perfil.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';
import { UpdatePerfilAccesosDto } from './dto/update-perfil-accesos.dto';
import { PerfilAdminItemDto, SubmoduleCatalogItemDto } from './dto/perfil-admin-response.dto';

@ApiTags('Administración - Perfiles')
@ApiBearerAuth()
@SuperAdminOnly()
@Controller('administracion/perfiles')
export class PerfilesAdminController {
  constructor(private readonly service: PerfilesAdminService) {}

  @Get()
  @ApiOperation({ summary: 'Listar perfiles con sus accesos configurados' })
  @ApiOkResponse({ type: [PerfilAdminItemDto] })
  findAll(): Promise<PerfilAdminItemDto[]> {
    return this.service.findAll();
  }

  @Get('catalogo-vistas')
  @ApiOperation({ summary: 'Catálogo de submódulos disponibles para asignar a un perfil' })
  @ApiOkResponse({ type: [SubmoduleCatalogItemDto] })
  findCatalogoVistas(): SubmoduleCatalogItemDto[] {
    return this.service.findCatalogoVistas();
  }

  @Post()
  @ApiOperation({ summary: 'Crear un perfil nuevo (sin restricción de acceso hasta que se configure)' })
  @ApiOkResponse({ type: PerfilAdminItemDto })
  create(@Body() dto: CreatePerfilDto): Promise<PerfilAdminItemDto> {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar nombre/reglas de un perfil existente' })
  @ApiOkResponse({ type: PerfilAdminItemDto })
  update(@Param('id') id: string, @Body() dto: UpdatePerfilDto): Promise<PerfilAdminItemDto> {
    return this.service.update(id, dto);
  }

  @Put(':id/accesos')
  @ApiOperation({ summary: 'Reemplazar los módulos/submódulos a los que tiene acceso el perfil' })
  @ApiOkResponse({ type: PerfilAdminItemDto })
  updateAccesos(@Param('id') id: string, @Body() dto: UpdatePerfilAccesosDto): Promise<PerfilAdminItemDto> {
    return this.service.updateAccesos(id, dto);
  }
}
