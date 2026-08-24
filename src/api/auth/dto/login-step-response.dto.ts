import { ApiProperty } from '@nestjs/swagger';

export class LoginStepResponseDto {
  @ApiProperty({
    enum: ['REQUIERE_CONFIGURAR_2FA', 'REQUIERE_CODIGO'],
    description: 'REQUIERE_CONFIGURAR_2FA: primera vez, hay que escanear el QR. REQUIERE_CODIGO: ya tiene 2FA activo, solo falta el código.',
  })
  estado: 'REQUIERE_CONFIGURAR_2FA' | 'REQUIERE_CODIGO';

  @ApiProperty({ description: 'Token temporal (10 min) para completar el segundo factor — no autoriza ningún otro endpoint' })
  pendingToken: string;
}
