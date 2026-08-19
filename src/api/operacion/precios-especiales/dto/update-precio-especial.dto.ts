import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdatePrecioEspecialDto {
  @ApiPropertyOptional({ description: 'ID del Producto' })
  @IsOptional() @IsString()
  productoId?: string;

  @ApiPropertyOptional({ description: 'ID del Tercero contacto' })
  @IsOptional() @IsString()
  contactoId?: string;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsNumber()
  precio?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  notas?: string;
}
