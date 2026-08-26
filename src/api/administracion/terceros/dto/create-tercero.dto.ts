import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf, ValidateNested } from 'class-validator';
import { ClasificacionTercero } from '@prisma/client';

export class DatosFiscalesDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  rfc?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  razonSocial?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  regimenFiscalId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  codigoPostalFiscal?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  usoCfdiId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  direccionFiscal?: string;
}

export class CreateTerceroDto {
  @ApiProperty({ description: 'false = Interno, true = Externo' })
  @IsBoolean()
  tipoContacto!: boolean;

  @ApiProperty({ description: 'false = Física, true = Moral' })
  @IsBoolean()
  tipoPersona!: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  primerNombre!: string;

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

  @ApiPropertyOptional({ description: 'Se calcula en el frontend a partir de los nombres/apellidos (Física) o del Primer Nombre (Moral); si se omite, se usa Primer Nombre' })
  @IsOptional() @IsString()
  nombreCompleto?: string;

  @ApiPropertyOptional({ description: 'Se calcula en el frontend igual que Nombre Completo' })
  @IsOptional() @IsString()
  nombreComercial?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ciudadId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  estadoId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  paisId!: string;

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

  @ApiPropertyOptional({ type: DatosFiscalesDto })
  @IsOptional() @ValidateNested() @Type(() => DatosFiscalesDto)
  datosFiscales?: DatosFiscalesDto;
}
