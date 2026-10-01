import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class CreateRemTecnicoBulkDto {
  @ApiProperty({ type: [String], description: 'IDs de los técnicos (Terceros) a asociar a la remisión' })
  @IsArray() @ArrayMinSize(1) @IsString({ each: true })
  tecnicoIds!: string[];
}
