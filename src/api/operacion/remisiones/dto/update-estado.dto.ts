import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export const ESTADOS_REMISION = ['Definitiva', 'Tramitada', 'Descorche', 'Trazabilidad'] as const;

export class UpdateEstadoDto {
  @ApiProperty({ enum: ESTADOS_REMISION })
  @IsIn(ESTADOS_REMISION)
  estado!: string;
}
