import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class PrecioEspecialQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 300 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 300;

  @ApiPropertyOptional({ description: 'Busca por producto (referencia/nombre) o contacto' })
  @IsOptional() @IsString()
  search?: string;
}
