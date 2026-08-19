import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export const CATEGORIAS_COMISION = ['TÉCNICOS', 'INVERSIONISTAS', 'PLUS'] as const;
export const TIPOS_COMISION = ['Comisión', 'Bono'] as const;
export const SELECCIONE_TIPO_COMISION = ['ACTIVIDAD EMPRESARIAL', 'RESICO'] as const;

export class CreateComisionDto {
  @ApiProperty({ description: 'ID de la programación a la que pertenece la comisión' })
  @IsString()
  programacionId!: string;

  @ApiProperty({ description: 'ID de la remisión relacionada' })
  @IsString()
  remisionId!: string;

  @ApiProperty({ enum: TIPOS_COMISION })
  @IsIn(TIPOS_COMISION)
  tipo!: string;

  @ApiProperty({ enum: CATEGORIAS_COMISION })
  @IsIn(CATEGORIAS_COMISION)
  categoria!: string;

  @ApiProperty({ description: 'ID del técnico/contacto (Tercero) que recibe la comisión' })
  @IsString()
  tecnicoId!: string;

  @ApiProperty({ description: 'Valor de la asignación (V/R Comis. o Bonific.), debe ser mayor a cero' })
  @IsNumber() @IsPositive()
  vrComision!: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  observaciones?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean()
  agregarIva?: boolean;

  @ApiPropertyOptional({ description: 'Porcentaje de IVA a cargar (ej. 16.00 para 16%), solo si agregarIva=true' })
  @IsOptional() @IsNumber()
  cargarPorcentaje?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean()
  quieresDesglosar?: boolean;

  @ApiPropertyOptional({ enum: SELECCIONE_TIPO_COMISION })
  @IsOptional() @IsIn(SELECCIONE_TIPO_COMISION)
  seleccioneTipo?: string;
}
