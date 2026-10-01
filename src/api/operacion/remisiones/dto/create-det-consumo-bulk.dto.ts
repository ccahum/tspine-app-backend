import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateDetConsumoDto } from './create-det-consumo.dto';

export class CreateDetConsumoBulkDto {
  @ApiProperty({ type: [CreateDetConsumoDto], description: 'Consumos a agregar a la remisión de una sola vez (mínimo uno)' })
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => CreateDetConsumoDto)
  items!: CreateDetConsumoDto[];
}
