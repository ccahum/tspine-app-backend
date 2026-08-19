import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateListaPrecioDto {
  @ApiProperty({ description: 'ID de la Subtarifa' })
  @IsString()
  subtarifaId!: string;

  @ApiProperty({ description: 'ID del Producto' })
  @IsString()
  productoId!: string;

  @ApiProperty()
  @Type(() => Number) @IsNumber()
  costoUtilidad!: number;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsNumber()
  porcentajeGanancia?: number;

  @ApiProperty()
  @Type(() => Number) @IsNumber()
  precio!: number;

  @ApiPropertyOptional({ enum: ['TRUE', 'FALSE'] })
  @IsOptional() @IsString()
  formaActualizacion?: string;
}
