import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AddRemTecnicoDto {
  @ApiProperty({ description: 'ID del técnico (Tercero) a asociar a la remisión' })
  @IsString()
  tecnicoId!: string;
}
