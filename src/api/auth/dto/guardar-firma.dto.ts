import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GuardarFirmaDto {
  @ApiProperty({ description: 'Firma dibujada, como PNG en base64 (data URL)' })
  @IsString() @IsNotEmpty()
  firma: string;
}
