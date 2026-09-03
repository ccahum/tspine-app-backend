import { ApiProperty } from '@nestjs/swagger';

export class UsuarioAdminItemDto {
  @ApiProperty() id: string;
  @ApiProperty() nombreCompleto: string;
  @ApiProperty() correo: string | null;
  @ApiProperty() perfilId: string | null;
  @ApiProperty() perfilNombre: string | null;
  @ApiProperty() sedeId: string | null;
  @ApiProperty() sedeNombre: string | null;
  @ApiProperty() activo: boolean;
  @ApiProperty() totpActivado: boolean;
}

export class PerfilOptionDto {
  @ApiProperty() id: string;
  @ApiProperty() nombre: string;
}

export class TerceroDisponibleDto {
  @ApiProperty() id: string;
  @ApiProperty() nombreCompleto: string;
  @ApiProperty({ nullable: true, description: 'Correo cargado del sistema viejo, si tiene — se usa solo para sugerir el usuario, no se conserva tal cual' })
  correo: string | null;
}
