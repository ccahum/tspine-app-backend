import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  usuario: {
    id: string;
    nombreCompleto: string;
    primerNombre: string | null;
    primerApellido: string | null;
    correo: string | null;
    perfilId: string | null;
    perfilNombre: string;
    reglas: string;
    sedeId: string | null;
  };
}
