import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SetFirmaCotizacionDto {
  @ApiProperty({ description: 'Firma dibujada por el usuario, como imagen PNG en base64 (data URL)' })
  @IsString()
  firma: string;
}
