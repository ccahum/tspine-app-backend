import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateCotizacionDto {
  @ApiPropertyOptional()
  @IsOptional() @IsDateString()
  fecha?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  dirigidoA?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  medico?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  hospitalId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  cirugia?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  cubrimientoId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  empresaId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  responsableEconomicoId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  sedeId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  numProveedor?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  tarifaId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  tiempoEntrega?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  observaciones?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  paqueteId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  nivel?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean()
  tieneDcto?: boolean;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsNumber()
  porcentajeDcto?: number;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsNumber()
  vrDcto?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  impuestos?: string;
}
