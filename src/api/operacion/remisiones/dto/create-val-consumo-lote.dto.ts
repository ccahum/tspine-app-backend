import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateValConsumoLoteDto {
  @ApiProperty({ description: 'ID del producto validado (ValConsumo) al que se le agrega el lote' })
  @IsString()
  @IsNotEmpty()
  valConsumoId!: string;

  @ApiProperty({ description: 'Sede donde está el lote' })
  @IsString()
  @IsNotEmpty()
  sedeId!: string;

  @ApiProperty({ description: 'Ubicación/almacén dentro de la sede' })
  @IsString()
  @IsNotEmpty()
  almacenId!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  cantidad!: number;
}
