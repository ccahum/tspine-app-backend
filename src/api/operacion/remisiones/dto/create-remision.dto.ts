import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export const IMPUESTOS_REMISION = ['I.V.A.', 'Retención', 'Todos'] as const;

export class CreateRemisionDto {
  @ApiProperty({ description: 'ID de la programación a la que pertenece la remisión' })
  @IsString()
  programacionId!: string;

  @ApiProperty({ description: 'Nombre del paciente' })
  @IsString()
  paciente!: string;

  @ApiProperty({ description: 'Cirugía realizada' })
  @IsString()
  cirugiaRealizada!: string;

  @ApiProperty({ description: 'ID de la Tarifa que representa el Cubrimiento (Particulares/Hospitales/Distribuidor/Aseguradora)' })
  @IsString()
  cubrimientoId!: string;

  @ApiProperty({ description: 'ID de la sub-tarifa dentro del cubrimiento elegido' })
  @IsString()
  tarifaId!: string;

  @ApiProperty({ description: 'ID del Tercero empresa (clasificación EMPRESA)' })
  @IsString()
  empresaId!: string;

  @ApiProperty({ description: 'ID del Tercero responsable económico' })
  @IsString()
  responsableEconomicoId!: string;

  @ApiProperty({ description: 'Nombre del anestesiólogo' })
  @IsString()
  anestesiologo!: string;

  @ApiPropertyOptional({ enum: IMPUESTOS_REMISION })
  @IsOptional() @IsIn(IMPUESTOS_REMISION)
  impuestos?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean()
  tieneDcto?: boolean;

  @ApiPropertyOptional({ description: 'Porcentaje de descuento (ej. 10.00 para 10%), solo si tieneDcto=true' })
  @IsOptional() @IsNumber()
  porcentajeDcto?: number;

  @ApiPropertyOptional({ description: 'Valor de descuento en pesos, solo si tieneDcto=true' })
  @IsOptional() @IsNumber()
  vrDctoPesos?: number;

  @ApiProperty({ description: 'Firma dibujada, como imagen en base64 (data URL)' })
  @IsString()
  firma!: string;
}
