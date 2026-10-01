import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsNumber, IsOptional, IsPositive, IsString, ValidateNested } from 'class-validator';

export const CATEGORIAS_COMISION = ['TÉCNICOS', 'INVERSIONISTAS', 'PLUS'] as const;
export const TIPOS_COMISION = ['Comisión', 'Bono'] as const;
export const SELECCIONE_TIPO_COMISION = ['ACTIVIDAD EMPRESARIAL', 'RESICO'] as const;

export class ComisionDetalleItemDto {
  @ApiProperty({ description: 'ID de la remisión de la que proviene el producto' })
  @IsString()
  remisionId!: string;

  @ApiProperty({ description: 'ID del producto consumido en esa remisión' })
  @IsString()
  productoId!: string;

  @ApiProperty({ description: 'Valor de esta línea del detalle, debe ser mayor a cero' })
  @IsNumber() @IsPositive()
  valor!: number;
}

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

  @ApiPropertyOptional({ description: 'Valor de la asignación (V/R Comis. o Bonific.). Opcional cuando se envía `detalles` (categoría Inversionistas), ya que ahí el total sale de la suma de sus valores' })
  @IsOptional() @IsNumber() @IsPositive()
  vrComision?: number;

  @ApiPropertyOptional({ type: [ComisionDetalleItemDto], description: 'Desglose por producto/remisión (Detalle de inversionistas) — cuando se envía, reemplaza a vrComision como el valor de la comisión' })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ComisionDetalleItemDto)
  detalles?: ComisionDetalleItemDto[];

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

  @ApiProperty({ enum: SELECCIONE_TIPO_COMISION })
  @IsIn(SELECCIONE_TIPO_COMISION)
  seleccioneTipo!: string;
}
