import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateDetRequisicionDto {
  @ApiProperty({ description: 'ID de la requisición (Movimiento) a la que pertenece este insumo' })
  @IsString()
  requisicionId!: string;

  @ApiPropertyOptional({ description: 'ID del Lote' })
  @IsOptional() @IsString()
  loteId?: string;

  @ApiPropertyOptional({ description: 'ID del Producto' })
  @IsOptional() @IsString()
  productoId?: string;

  @ApiPropertyOptional({ description: 'ID de la tarifa asociada. Si no se envía, se usa la tarifa actual de la requisición.' })
  @IsOptional() @IsString()
  tarifaAsociadaId?: string;

  @ApiProperty({ description: 'Cantidad, debe ser mayor a cero' })
  @IsNumber() @IsPositive()
  cantidad!: number;

  @ApiProperty({ description: 'Precio, debe ser mayor a cero' })
  @IsNumber() @IsPositive()
  precio!: number;
}
