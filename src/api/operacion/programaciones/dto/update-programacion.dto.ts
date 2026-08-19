import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateProgramacionDto {
  @ApiPropertyOptional({ description: 'Fecha de la cirugía (yyyy-MM-dd)' })
  @IsOptional() @IsDateString()
  fechaQx?: string;

  @ApiPropertyOptional({ description: 'Hora de la cirugía (HH:mm)' })
  @IsOptional() @IsString()
  horaQx?: string;

  @ApiPropertyOptional({ description: 'ID de la sede' })
  @IsOptional() @IsString()
  sedeId?: string;

  @ApiPropertyOptional({ description: 'ID del hospital' })
  @IsOptional() @IsString()
  hospitalId?: string;

  @ApiPropertyOptional({ description: 'Observaciones' })
  @IsOptional() @IsString()
  observaciones?: string;

  @ApiPropertyOptional({ description: 'Consumo' })
  @IsOptional() @IsString()
  consumo?: string;

  @ApiPropertyOptional({ type: [String], description: 'IDs de médicos (Tercero)' })
  @IsOptional() @IsArray()
  medicoIds?: string[];
}
