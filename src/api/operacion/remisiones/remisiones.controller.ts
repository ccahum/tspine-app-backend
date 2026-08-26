import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, Res, StreamableFile } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { createReadStream } from 'fs';
import { RemisionesService } from './remisiones.service';
import { UpdateEstadoDto } from './dto/update-estado.dto';
import { RemisionQueryDto } from './dto/remision-query.dto';
import { CreateComisionDto } from './dto/create-comision.dto';
import { CreateRequisicionDto } from './dto/create-requisicion.dto';
import { UpdateRequisicionDto } from './dto/update-requisicion.dto';
import { CreateRemisionDto } from './dto/create-remision.dto';
import { UpdateRemisionDto } from './dto/update-remision.dto';
import { CreateTecnicoSugeridoDto } from './dto/create-tecnico-sugerido.dto';
import { CreateDetRequisicionDto } from './dto/create-det-requisicion.dto';
import { UpdateDetRequisicionDto } from './dto/update-det-requisicion.dto';
import { CreateValConsumoLoteDto } from './dto/create-val-consumo-lote.dto';
import { CreateDocumentoProgramacionDto } from './dto/create-documento-programacion.dto';
import { SuperAdminOnly } from '@app/commons/decorators/super-admin-only.decorator';

@ApiTags('Operación - Remisiones')
@ApiBearerAuth()
@Controller('operacion/remisiones')
export class RemisionesController {
  constructor(private readonly service: RemisionesService) {}

  @Get('buscar')
  @ApiOperation({ summary: 'Listado global de remisiones (búsqueda, filtro por estado, paginado)' })
  findAll(@Query() query: RemisionQueryDto) {
    return this.service.findAll(query);
  }

  @Get('cxc-stats')
  @ApiOperation({ summary: 'Conteos de remisiones por CXC? (Todo/Pendiente/Enviada)' })
  getCxcStats() {
    return this.service.getCxcStats();
  }

  @Get()
  @ApiOperation({ summary: 'Listar remisiones de una programación' })
  @ApiQuery({ name: 'programacionId', required: true })
  @ApiOkResponse({ description: 'Remisiones de la programación' })
  findByProgramacion(@Query('programacionId') programacionId: string) {
    return this.service.findByProgramacion(programacionId);
  }

  @Get('tecnicos')
  @ApiOperation({ summary: 'Técnicos asociados a una programación (Rem_Técnicos)' })
  @ApiQuery({ name: 'programacionId', required: true })
  findTecnicosByProgramacion(@Query('programacionId') programacionId: string) {
    return this.service.findTecnicosByProgramacion(programacionId);
  }

  @Get('consumos')
  @ApiOperation({ summary: 'Consumos (Det_Consumo) de una programación, agrupados por remisión' })
  @ApiQuery({ name: 'programacionId', required: true })
  findConsumosByProgramacion(@Query('programacionId') programacionId: string) {
    return this.service.findConsumosByProgramacion(programacionId);
  }

  @Get('consumos/:id')
  @ApiOperation({ summary: 'Detalle de un consumo (Det_Consumo) + producto validado (ValConsumo)' })
  getConsumoDetalle(@Param('id') id: string) {
    return this.service.getConsumoDetalle(id);
  }

  @Get('producto-validado/:id')
  @ApiOperation({ summary: 'Detalle de un producto validado (ValConsumo) + lotes validados' })
  getValConsumoDetalle(@Param('id') id: string) {
    return this.service.getValConsumoDetalle(id);
  }

  @Get('comisiones/:id')
  @ApiOperation({ summary: 'Detalle de una comisión (Det_Tecnicos) + programación realizada (ProgramacionPagos)' })
  getDetTecnicoDetalle(@Param('id') id: string) {
    return this.service.getDetTecnicoDetalle(id);
  }

  @Get('validacion-consumos')
  @ApiOperation({ summary: 'Validación de consumos (ValConsumo) de una programación, agrupados por remisión' })
  @ApiQuery({ name: 'programacionId', required: true })
  findValidacionConsumosByProgramacion(@Query('programacionId') programacionId: string) {
    return this.service.findValidacionConsumosByProgramacion(programacionId);
  }

  @Get('comisiones')
  @ApiOperation({ summary: 'Asignación de comisiones (Det_Tecnicos) de una programación, agrupadas por categoría' })
  @ApiQuery({ name: 'programacionId', required: true })
  findComisionesByProgramacion(@Query('programacionId') programacionId: string) {
    return this.service.findComisionesByProgramacion(programacionId);
  }

  @Post('comisiones')
  @ApiOperation({ summary: 'Crear una nueva asignación de comisión (Det_Tecnicos)' })
  @ApiCreatedResponse({ description: 'Comisión creada' })
  createComision(@Body() dto: CreateComisionDto) {
    return this.service.createComision(dto);
  }

  @Get('comisiones-tecnicos')
  @ApiOperation({ summary: 'Buscar técnicos/contactos (Terceros) por nombre, para asignar una comisión' })
  searchTecnicos(@Query('search') search?: string) {
    return this.service.searchTecnicos(search);
  }

  @Get('empresas')
  @ApiOperation({ summary: 'Buscar Terceros clasificados como EMPRESA, para el campo Empresa de una remisión' })
  searchEmpresas(@Query('search') search?: string) {
    return this.service.searchEmpresas(search);
  }

  @Get('empresa-sugerida')
  @ApiOperation({ summary: 'Empresa sugerida/autoseleccionada para una remisión, según Cubrimiento + Sede (regla regional) y perfil del usuario' })
  getEmpresaSugerida(@Query('cubrimientoId') cubrimientoId: string, @Query('sedeId') sedeId: string) {
    return this.service.getEmpresaSugerida(cubrimientoId, sedeId);
  }

  @Get('tecnicos-comisionistas')
  @ApiOperation({ summary: 'Buscar Terceros clasificados como COMISIONISTA, para sugerir técnicos' })
  searchTecnicosComisionistas(@Query('search') search?: string) {
    return this.service.searchTecnicosComisionistas(search);
  }

  @Get('tecnicos-sugeridos')
  @ApiOperation({ summary: 'Técnicos sugeridos (comisionistas) de una programación' })
  @ApiQuery({ name: 'programacionId', required: true })
  findTecnicosSugeridosByProgramacion(@Query('programacionId') programacionId: string) {
    return this.service.findTecnicosSugeridosByProgramacion(programacionId);
  }

  @Post('tecnicos-sugeridos')
  @ApiOperation({ summary: 'Agregar un técnico sugerido (comisionista) a una programación' })
  @ApiCreatedResponse({ description: 'Técnico sugerido creado' })
  createTecnicoSugerido(@Body() dto: CreateTecnicoSugeridoDto, @Req() req: Request) {
    const user = req['user'] as { sub: string };
    return this.service.createTecnicoSugerido(dto, user.sub);
  }

  @Delete('tecnicos-sugeridos/:id')
  @ApiOperation({ summary: 'Eliminar un técnico sugerido' })
  deleteTecnicoSugerido(@Param('id') id: string) {
    return this.service.deleteTecnicoSugerido(id);
  }

  @Get('requisiciones')
  @ApiOperation({ summary: 'Requisiciones de una programación' })
  @ApiQuery({ name: 'programacionId', required: true })
  findRequisicionesByProgramacion(@Query('programacionId') programacionId: string) {
    return this.service.findRequisicionesByProgramacion(programacionId);
  }

  @Get('requisiciones/:id')
  @ApiOperation({ summary: 'Detalle de una requisición' })
  getRequisicionDetalle(@Param('id') id: string) {
    return this.service.getRequisicionDetalle(id);
  }

  @Patch('requisiciones/:id')
  @ApiOperation({ summary: 'Editar una requisición existente' })
  updateRequisicion(@Param('id') id: string, @Body() dto: UpdateRequisicionDto) {
    return this.service.updateRequisicion(id, dto);
  }

  @Delete('requisiciones/:id')
  @ApiOperation({ summary: 'Eliminar una requisición (borra en cascada sus insumos)' })
  async deleteRequisicion(@Param('id') id: string) {
    await this.service.deleteRequisicion(id);
    return { success: true };
  }

  @Post('requisiciones')
  @ApiOperation({ summary: 'Crear una nueva requisición' })
  @ApiCreatedResponse({ description: 'Requisición creada' })
  createRequisicion(@Body() dto: CreateRequisicionDto, @Req() req: Request) {
    const user = req['user'] as { sub: string };
    return this.service.createRequisicion(dto, user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Crear una nueva remisión' })
  @ApiCreatedResponse({ description: 'Remisión creada' })
  createRemision(@Body() dto: CreateRemisionDto, @Req() req: Request) {
    const user = req['user'] as { sub: string };
    return this.service.createRemision(dto, user.sub);
  }

  @Get('cubrimientos')
  @ApiOperation({ summary: 'Cubrimientos (Tarifas de nivel superior) disponibles para Requisiciones' })
  findCubrimientos() {
    return this.service.findCubrimientos();
  }

  @Get('tarifas')
  @ApiOperation({ summary: 'Sub-tarifas de un Cubrimiento' })
  @ApiQuery({ name: 'cubrimientoId', required: true })
  findTarifasByCubrimiento(@Query('cubrimientoId') cubrimientoId: string) {
    return this.service.findTarifasByCubrimiento(cubrimientoId);
  }

  @Get('requisiciones/:id/detalles')
  @ApiOperation({ summary: 'Insumos (Det_Requisicion) de una requisición' })
  findDetallesByRequisicion(@Param('id') id: string) {
    return this.service.findDetallesByRequisicion(id);
  }

  @Post('detalles-requisicion')
  @ApiOperation({ summary: 'Agregar un insumo a una requisición' })
  @ApiCreatedResponse({ description: 'Insumo creado' })
  createDetRequisicion(@Body() dto: CreateDetRequisicionDto) {
    return this.service.createDetRequisicion(dto);
  }

  @Patch('detalles-requisicion/:id')
  @ApiOperation({ summary: 'Editar un insumo de una requisición' })
  updateDetRequisicion(@Param('id') id: string, @Body() dto: UpdateDetRequisicionDto) {
    return this.service.updateDetRequisicion(id, dto);
  }

  @Get('lotes')
  @ApiOperation({ summary: 'Buscar Lotes por nombre' })
  searchLotes(@Query('search') search?: string) {
    return this.service.searchLotes(search);
  }

  @Get('productos')
  @ApiOperation({ summary: 'Buscar Productos por nombre (incluye precios por cubrimiento)' })
  searchProductos(@Query('search') search?: string) {
    return this.service.searchProductos(search);
  }

  @Get('almacenes')
  @ApiOperation({ summary: 'Ubicaciones/almacenes disponibles, opcionalmente filtrados por sede' })
  findAlmacenes(@Query('sedeId') sedeId?: string) {
    return this.service.findAlmacenes(sedeId);
  }

  @Post('producto-validado/lotes')
  @ApiOperation({ summary: 'Agregar un lote validado a un producto validado (ValConsumo)' })
  @ApiCreatedResponse({ description: 'Lote validado creado' })
  createValConsumoLote(@Body() dto: CreateValConsumoLoteDto, @Req() req: Request) {
    const user = req['user'] as { sub: string };
    return this.service.createValConsumoLote(dto, user.sub);
  }

  @Get('notas-credito')
  @ApiOperation({ summary: 'Notas de crédito de una programación (vía Factura → Remisión)' })
  @ApiQuery({ name: 'programacionId', required: true })
  findNotasCreditoByProgramacion(@Query('programacionId') programacionId: string) {
    return this.service.findNotasCreditoByProgramacion(programacionId);
  }

  @Get('gastos')
  @ApiOperation({ summary: 'Gastos cuya FUENTE es esta programación' })
  @ApiQuery({ name: 'programacionId', required: true })
  findGastosByProgramacion(@Query('programacionId') programacionId: string) {
    return this.service.findGastosByProgramacion(programacionId);
  }

  @Get('fuentes')
  @ApiOperation({ summary: 'Fuentes (Programación↔Gasto) de esta programación' })
  @ApiQuery({ name: 'programacionId', required: true })
  findFuentesByProgramacion(@Query('programacionId') programacionId: string) {
    return this.service.findFuentesByProgramacion(programacionId);
  }

  @Get('documentos')
  @ApiOperation({ summary: 'Documentos cargados de una programación' })
  @ApiQuery({ name: 'programacionId', required: true })
  findDocumentosByProgramacion(@Query('programacionId') programacionId: string) {
    return this.service.findDocumentosByProgramacion(programacionId);
  }

  @Post('documentos')
  @ApiOperation({ summary: 'Agrega un documento (PDF en base64) a una programación' })
  @ApiCreatedResponse({ description: 'Documento creado' })
  createDocumentoProgramacion(@Body() dto: CreateDocumentoProgramacionDto, @Req() req: Request) {
    const user = req['user'] as { sub: string };
    return this.service.createDocumentoProgramacion(dto, user.sub);
  }

  @Get('documentos/:id/archivo')
  @ApiOperation({ summary: 'Descarga el PDF de un documento de programación' })
  async getDocumentoProgramacionArchivo(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const { path, nombre } = await this.service.getDocumentoProgramacionArchivo(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${nombre}.pdf"`,
    });
    return new StreamableFile(createReadStream(path));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una remisión (consumos, técnicos, facturación)' })
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post(':id/convertir-factura')
  @SuperAdminOnly()
  @ApiOperation({ summary: 'Convierte una remisión en factura: crea la Factura, sus líneas (consumos pendientes por facturar) y marca la remisión como enviada a CxC' })
  @ApiCreatedResponse({ description: 'Factura creada' })
  convertirEnFactura(@Param('id') id: string, @Req() req: Request) {
    const user = req['user'] as { sub: string };
    return this.service.convertirEnFactura(id, user.sub);
  }

  @Patch(':id/estado')
  @ApiOperation({ summary: 'Actualizar el estado de una remisión' })
  updateEstado(@Param('id') id: string, @Body() dto: UpdateEstadoDto) {
    return this.service.updateEstado(id, dto.estado);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar una remisión (solo permitido si está en estado Tramitada o Descorche)' })
  updateRemision(@Param('id') id: string, @Body() dto: UpdateRemisionDto) {
    return this.service.updateRemision(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una remisión (bloqueado si ya tiene factura asociada)' })
  async deleteRemision(@Param('id') id: string) {
    await this.service.deleteRemision(id);
    return { success: true };
  }
}
