import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf, ValidateNested } from 'class-validator';
import { ClasificacionTercero } from '@prisma/client';
import { DatosFiscalesDto } from './create-tercero.dto';

export class UpdateTerceroDto {
  @ApiPropertyOptional()
  @IsOptional() @IsBoolean()
  tipoContacto?: boolean;

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean()
  tipoPersona?: boolean;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  primerNombre?: string;

  @ApiPropertyOptional({ description: 'Obligatorio si tipoPersona = Física (false)' })
  @ValidateIf(o => o.tipoPersona === false)
  @IsString() @IsNotEmpty()
  segundoNombre?: string;

  @ApiPropertyOptional({ description: 'Obligatorio si tipoPersona = Física (false)' })
  @ValidateIf(o => o.tipoPersona === false)
  @IsString() @IsNotEmpty()
  primerApellido?: string;

  @ApiPropertyOptional({ description: 'Obligatorio si tipoPersona = Física (false)' })
  @ValidateIf(o => o.tipoPersona === false)
  @IsString() @IsNotEmpty()
  segundoApellido?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  nombreCompleto?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  nombreComercial?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  ciudadId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  estadoId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  paisId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  observaciones?: string;

  @ApiPropertyOptional({ enum: ClasificacionTercero, isArray: true })
  @IsOptional() @IsArray() @IsEnum(ClasificacionTercero, { each: true })
  clasificaciones?: ClasificacionTercero[];

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean()
  mir?: boolean;

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean()
  grupo?: boolean;

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean()
  activo?: boolean;

  @ApiPropertyOptional({ type: DatosFiscalesDto })
  @IsOptional() @ValidateNested() @Type(() => DatosFiscalesDto)
  datosFiscales?: DatosFiscalesDto;
}
