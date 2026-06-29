import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  usuario: {
    id: string;
    nombreCompleto: string;
    correo: string | null;
    perfilId: string | null;
    perfilNombre: string;
    reglas: string;
    sedeId: string | null;
  };
}
