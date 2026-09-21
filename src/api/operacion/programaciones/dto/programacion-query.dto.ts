import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const PROGRAMACION_SORT_FIELDS = ['numProgram', 'createdAt', 'fechaQx', 'horaQx', 'sede', 'hospital', 'observaciones'] as const;
export type ProgramacionSortField = (typeof PROGRAMACION_SORT_FIELDS)[number];

export class ProgramacionQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  // Tope real — antes no había ninguno y CalendarPage.tsx pedía limit=10000 para traer todo el
  // histórico con 6 relaciones incluidas por fila en cada carga del calendario. Ver /calendario
  // más abajo para el endpoint liviano que reemplaza ese uso específico. 300 (no 200) porque
  // ProgramacionesPage.tsx pide ese límite por página para su propio listado.
  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(300)
  limit?: number = 50;

  @ApiPropertyOptional({ description: 'Fecha inicio YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Fecha fin YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sedeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  cerrada?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  sinRemision?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  sinComision?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  consumoNoValidado?: boolean;

  @ApiPropertyOptional({ description: 'Solo programaciones con al menos una requisición (regla para poder agregarles una remisión)' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  conRequisicion?: boolean;

  @ApiPropertyOptional({ enum: PROGRAMACION_SORT_FIELDS, description: 'Columna por la que ordenar el listado (clic en el encabezado de la tabla)' })
  @IsOptional() @IsIn(PROGRAMACION_SORT_FIELDS)
  sortBy?: ProgramacionSortField;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional() @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
