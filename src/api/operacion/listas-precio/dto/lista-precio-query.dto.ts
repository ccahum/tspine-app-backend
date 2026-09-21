import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export const LISTA_PRECIO_SORT_FIELDS = [
  'subtarifa',
  'producto',
  'costoUtilidad',
  'porcentajeGanancia',
  'precio',
  'dependeDe',
  'formaActualizacion',
] as const;
export type ListaPrecioSortField = (typeof LISTA_PRECIO_SORT_FIELDS)[number];

export class ListaPrecioQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 300 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 300;

  @ApiPropertyOptional({ description: 'Busca por producto (referencia/nombre) o subtarifa' })
  @IsOptional() @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: LISTA_PRECIO_SORT_FIELDS })
  @IsOptional() @IsIn(LISTA_PRECIO_SORT_FIELDS)
  sortBy?: ListaPrecioSortField;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional() @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
