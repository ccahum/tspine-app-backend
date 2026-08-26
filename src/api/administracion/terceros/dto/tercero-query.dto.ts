import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ClasificacionTercero } from '@prisma/client';

export class TerceroQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 300 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 300;

  @ApiPropertyOptional({ description: 'Busca por nombre completo o correo' })
  @IsOptional() @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ClasificacionTercero })
  @IsOptional() @IsEnum(ClasificacionTercero)
  clasificacion?: ClasificacionTercero;
}
