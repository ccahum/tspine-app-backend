import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateEstadoAutorizacionDto {
  @ApiProperty({ enum: ['AUTORIZADO', 'NO AUTORIZADO'] })
  @IsIn(['AUTORIZADO', 'NO AUTORIZADO'])
  estado: 'AUTORIZADO' | 'NO AUTORIZADO';

  @ApiPropertyOptional({ description: 'Motivo del rechazo (obligatorio si estado = NO AUTORIZADO)' })
  @IsOptional() @IsString()
  motivo?: string;
}
