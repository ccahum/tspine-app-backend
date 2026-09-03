import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class OlvidePasswordDto {
  @ApiProperty({ example: 'ccahum', description: 'Nombre de usuario (parte antes del @)' })
  @IsString()
  @IsNotEmpty()
  usuario: string;
}
