import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsArray } from 'class-validator';

export class CreateProgramacionDto {
  @ApiProperty({ description: 'Fecha de la cirugía (yyyy-MM-dd)' })
  @IsOptional()
  @IsDateString()
  fechaQx?: string;

  @ApiProperty({ description: 'Hora de la cirugía (HH:mm)' })
  @IsOptional()
  @IsString()
  horaQx?: string;

  @ApiProperty({ description: 'ID o nombre de la sede' })
  @IsOptional()
  @IsString()
  sede?: string;

  @ApiProperty({ description: 'ID o nombre del hospital' })
  @IsOptional()
  @IsString()
  hospital?: string;

  @ApiPropertyOptional({ description: 'Observaciones' })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional({ description: 'Consumo' })
  @IsOptional()
  @IsString()
  consumo?: string;

  @ApiPropertyOptional({ type: [String], description: 'IDs de médicos' })
  @IsOptional()
  @IsArray()
  medicos?: string[];
}
