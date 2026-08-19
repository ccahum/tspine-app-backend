import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsNumber, IsOptional, IsPositive, IsString, ValidateNested } from 'class-validator';

export class InsumoLineDto {
  @ApiPropertyOptional({ description: 'ID del Lote' })
  @IsOptional() @IsString()
  loteId?: string;

  @ApiPropertyOptional({ description: 'ID del Producto' })
  @IsOptional() @IsString()
  productoId?: string;

  @ApiProperty({ description: 'Cantidad, debe ser mayor a cero' })
  @IsNumber() @IsPositive()
  cantidad!: number;

  @ApiProperty({ description: 'Precio, debe ser mayor a cero' })
  @IsNumber() @IsPositive()
  precio!: number;
}

export class CreateRequisicionDto {
  @ApiProperty({ description: 'ID de la programación a la que pertenece la requisición' })
  @IsString()
  programacionId!: string;

  @ApiProperty({ description: 'Fecha de la requisición' })
  @IsDateString()
  fecha!: string;

  @ApiProperty({ description: 'ID de la Tarifa que representa el Cubrimiento (Particulares/Hospitales/Distribuidor/Aseguradora)' })
  @IsString()
  cubrimientoId!: string;

  @ApiProperty({ description: 'ID de la sub-tarifa dentro del cubrimiento elegido' })
  @IsString()
  tarifaId!: string;

  @ApiProperty({ type: [InsumoLineDto], description: 'Insumos a agregar junto con la requisición (mínimo uno)' })
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => InsumoLineDto)
  insumos!: InsumoLineDto[];
}
