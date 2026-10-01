import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export class CreateValConsumoDto {
  @ApiProperty({ description: 'Sede donde se validó el consumo' })
  @IsString()
  @IsNotEmpty()
  sedeConsumoId!: string;

  @ApiProperty({ description: 'true si el producto realmente consumido es el mismo que el remisionado ("Mismo Producto"), false si fue diferente ("Diferente")' })
  @IsBoolean()
  prodRealConsumido!: boolean;

  @ApiPropertyOptional({ description: 'Producto realmente consumido, requerido solo si prodRealConsumido es false' })
  @ValidateIf(o => o.prodRealConsumido === false)
  @IsString()
  @IsNotEmpty()
  productoId?: string;

  @ApiProperty()
  @IsBoolean()
  prodDeTspine!: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  observacionesAlm!: string;
}
