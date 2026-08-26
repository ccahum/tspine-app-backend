import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export const TIPOS_DE_CUENTA = ['Interna', 'Externa'] as const;
export const TIPOS_CUENTA = ['Efectivo', 'Bancaria', 'Compensación'] as const;

export class CreateTerceroCuentaDto {
  @ApiProperty({ enum: TIPOS_DE_CUENTA, description: 'Interna si es cuenta de la empresa, Externa si es ajena a la empresa' })
  @IsString() @IsIn(TIPOS_DE_CUENTA)
  tipoDeCuenta!: string;

  @ApiProperty({ enum: TIPOS_CUENTA })
  @IsString() @IsIn(TIPOS_CUENTA)
  tipo!: string;

  @ApiPropertyOptional({ description: 'Obligatorio si tipo no es Efectivo' })
  @ValidateIf(o => o.tipo !== 'Efectivo')
  @IsString() @IsNotEmpty()
  bancoId?: string;

  @ApiPropertyOptional({ description: 'Obligatorio si tipo no es Efectivo' })
  @ValidateIf(o => o.tipo !== 'Efectivo')
  @IsString() @IsNotEmpty()
  noDeCuenta?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  clabeInterbancaria?: string;
}
