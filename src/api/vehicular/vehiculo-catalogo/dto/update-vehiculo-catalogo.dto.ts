import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateVehiculoCatalogoDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  placas?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  nombre?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  marca?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  modelo?: string;

  @ApiPropertyOptional({ description: 'Foto del vehículo, codificada como data URL en base64 (si se envía, reemplaza la actual)' })
  @IsOptional() @IsString()
  fotografia?: string;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  kmActual?: number;

  @ApiPropertyOptional({ description: 'ID de la Sede' })
  @IsOptional() @IsString()
  sedeId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  estado?: string;
}
