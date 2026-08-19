import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateListaPrecioDto {
  @ApiPropertyOptional({ description: 'ID de la Subtarifa' })
  @IsOptional() @IsString()
  subtarifaId?: string;

  @ApiPropertyOptional({ description: 'ID del Producto' })
  @IsOptional() @IsString()
  productoId?: string;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsNumber()
  costoUtilidad?: number;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsNumber()
  porcentajeGanancia?: number;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsNumber()
  precio?: number;

  @ApiPropertyOptional({ enum: ['N', 'Y'] })
  @IsOptional() @IsString()
  formaActualizacion?: string;
}
