import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateEstadoSolicitudDto {
  @ApiProperty({ enum: ['APROBADA', 'RECHAZADA'] })
  @IsIn(['APROBADA', 'RECHAZADA'])
  estado: 'APROBADA' | 'RECHAZADA';

  @ApiPropertyOptional({ description: 'Motivo del rechazo (obligatorio si estado = RECHAZADA)' })
  @IsOptional() @IsString()
  motivoRechazo?: string;
}
