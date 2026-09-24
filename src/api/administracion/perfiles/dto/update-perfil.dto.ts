import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ReglaCrud } from '@prisma/client';

export class UpdatePerfilDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @ApiPropertyOptional({ enum: ReglaCrud })
  @IsOptional()
  @IsEnum(ReglaCrud)
  reglas?: ReglaCrud;
}
