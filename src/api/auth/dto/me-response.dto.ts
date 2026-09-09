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
}
