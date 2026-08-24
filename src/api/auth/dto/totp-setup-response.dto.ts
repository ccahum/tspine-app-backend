import { ApiProperty } from '@nestjs/swagger';

export class TotpSetupResponseDto {
  @ApiProperty({ description: 'Imagen QR en base64 (data URL) para escanear con Google Authenticator/Authy' })
  qrDataUrl: string;

  @ApiProperty({ description: 'Secreto en texto, por si el usuario prefiere ingresarlo manualmente' })
  secret: string;
}
