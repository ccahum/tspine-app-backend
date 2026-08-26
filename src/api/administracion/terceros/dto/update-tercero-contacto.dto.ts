import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { TIPOS_CONTACTO } from './create-tercero-contacto.dto';

export class UpdateTerceroContactoDto {
  @ApiPropertyOptional({ enum: TIPOS_CONTACTO })
  @IsOptional() @IsString() @IsIn(TIPOS_CONTACTO)
  tipo?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  dato?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  personaContacto?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  notas?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean()
  principal?: boolean;
}
