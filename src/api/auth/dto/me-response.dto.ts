import { ApiProperty } from '@nestjs/swagger';

export class MeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombreCompleto: string;

  @ApiProperty({ nullable: true })
  primerNombre: string | null;

  @ApiProperty({ nullable: true })
  primerApellido: string | null;

  @ApiProperty()
  correo: string | null;

  @ApiProperty()
  perfilId: string | null;

  @ApiProperty()
  perfilNombre: string;

  @ApiProperty()
  reglas: string;

  @ApiProperty()
  sedeId: string | null;

  @ApiProperty()
  tieneFirma: boolean;

  @ApiProperty()
  accesoRestringido: boolean;

  @ApiProperty({ type: [String] })
  vistas: string[];

  @ApiProperty({ nullable: true })
  vistaInicial: string | null;
}
