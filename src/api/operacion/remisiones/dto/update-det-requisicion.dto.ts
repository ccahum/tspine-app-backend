import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateDetRequisicionDto {
  @ApiPropertyOptional({ description: 'ID del Lote' })
  @IsOptional() @IsString()
  loteId?: string;

  @ApiPropertyOptional({ description: 'ID del Producto' })
  @IsOptional() @IsString()
  productoId?: string;

  @ApiPropertyOptional({ description: 'Cantidad, debe ser mayor a cero' })
  @IsOptional() @IsNumber() @IsPositive()
  cantidad?: number;

  @ApiPropertyOptional({ description: 'Precio, debe ser mayor a cero' })
  @IsOptional() @IsNumber() @IsPositive()
  precio?: number;
}
