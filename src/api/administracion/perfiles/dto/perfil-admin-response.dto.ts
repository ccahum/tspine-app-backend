import { ApiProperty } from '@nestjs/swagger';

export class PerfilAdminItemDto {
  @ApiProperty() id: string;
  @ApiProperty() nombre: string;
  @ApiProperty() reglas: string;
  @ApiProperty({ nullable: true }) vistaInicial: string | null;
  @ApiProperty() accesoRestringido: boolean;
  @ApiProperty({ type: [String] }) vistas: string[];
}

export class SubmoduleCatalogItemDto {
  @ApiProperty() id: string;
  @ApiProperty() modulo: string;
  @ApiProperty() moduloLabel: string;
  @ApiProperty() label: string;
}
