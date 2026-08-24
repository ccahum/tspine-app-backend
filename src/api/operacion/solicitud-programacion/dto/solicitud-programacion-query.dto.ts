import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export const ESTADOS_SOLICITUD = ['PENDIENTE', 'APROBADA', 'RECHAZADA'] as const;
export type EstadoSolicitud = (typeof ESTADOS_SOLICITUD)[number];

export class SolicitudProgramacionQueryDto {
  @ApiPropertyOptional({
    enum: ESTADOS_SOLICITUD,
    description: 'Si se omite, regresa los registros de todos los estados visibles para el usuario',
  })
  @IsOptional() @IsIn(ESTADOS_SOLICITUD)
  estado?: EstadoSolicitud;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 20;
}
