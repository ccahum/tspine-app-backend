import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RecalcularNombresEspecialesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hospitalId?: string;
}
