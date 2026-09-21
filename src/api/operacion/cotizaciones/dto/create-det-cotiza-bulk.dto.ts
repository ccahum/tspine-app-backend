import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateDetCotizaDto } from './create-det-cotiza.dto';

export class CreateDetCotizaBulkDto {
  @ApiProperty({ type: [CreateDetCotizaDto], description: 'Ítems a agregar, en el orden en que deben quedar listados (mínimo uno)' })
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => CreateDetCotizaDto)
  items!: CreateDetCotizaDto[];
}
