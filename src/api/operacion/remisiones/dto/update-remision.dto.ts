import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { IMPUESTOS_REMISION } from './create-remision.dto';

export class UpdateRemisionDto {
  @ApiPropertyOptional({ description: 'ID del Tercero usuario/registrado por' })
  @IsOptional() @IsString()
  usuarioId?: string;

  @ApiPropertyOptional({ description: 'Nombre del paciente' })
  @IsOptional() @IsString()
  paciente?: string;

  @ApiPropertyOptional({ description: 'Cirugía realizada' })
  @IsOptional() @IsString()
  cirugiaRealizada?: string;

  @ApiPropertyOptional({ description: 'ID de la Tarifa que representa el Cubrimiento (Particulares/Hospitales/Distribuidor/Aseguradora)' })
  @IsOptional() @IsString()
  cubrimientoId?: string;

  @ApiPropertyOptional({ description: 'ID de la sub-tarifa dentro del cubrimiento elegido' })
  @IsOptional() @IsString()
  tarifaId?: string;

  @ApiPropertyOptional({ description: 'ID del Tercero empresa (clasificación EMPRESA)' })
  @IsOptional() @IsString()
  empresaId?: string;

  @ApiPropertyOptional({ description: 'ID del Tercero responsable económico' })
  @IsOptional() @IsString()
  responsableEconomicoId?: string;

  @ApiPropertyOptional({ description: 'Nombre del anestesiólogo' })
  @IsOptional() @IsString()
  anestesiologo?: string;

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
}
