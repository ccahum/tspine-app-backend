import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePrecioEspecialDto {
  @ApiProperty({ description: 'ID del Producto' })
  @IsString()
  productoId!: string;

  @ApiProperty({ description: 'ID del Tercero contacto' })
  @IsString()
  contactoId!: string;

  @ApiProperty()
  @Type(() => Number) @IsNumber()
  precio!: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  notas?: string;
}
