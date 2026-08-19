import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export const ESTADOS_AUTORIZACION = ['PENDIENTE', 'AUTORIZADO', 'NO AUTORIZADO'] as const;
export type EstadoAutorizacion = (typeof ESTADOS_AUTORIZACION)[number];

export class AutorizacionConsumoQueryDto {
  @ApiPropertyOptional({
    enum: ESTADOS_AUTORIZACION,
    description: 'Si se omite, regresa los registros de todos los estados visibles para el usuario',
  })
  @IsOptional() @IsIn(ESTADOS_AUTORIZACION)
  estado?: EstadoAutorizacion;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 100 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 100;
}
