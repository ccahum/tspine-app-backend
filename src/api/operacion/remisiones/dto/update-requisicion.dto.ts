import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateRequisicionDto {
  @ApiPropertyOptional({ description: 'Fecha de la requisición' })
  @IsOptional() @IsDateString()
  fecha?: string;

  @ApiPropertyOptional({ description: 'ID de la Tarifa que representa el Cubrimiento' })
  @IsOptional() @IsString()
  cubrimientoId?: string;

  @ApiPropertyOptional({ description: 'ID de la sub-tarifa dentro del cubrimiento elegido' })
  @IsOptional() @IsString()
  tarifaId?: string;
}
