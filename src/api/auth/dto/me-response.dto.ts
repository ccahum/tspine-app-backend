import { ApiProperty } from '@nestjs/swagger';

export class MeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombreCompleto: string;

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
