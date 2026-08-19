import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class UpdateDetCotizaDto {
  @ApiProperty()
  @IsString()
  productoId: string;

  @ApiProperty()
  @Type(() => Number) @IsNumber()
  cantidad: number;

  @ApiProperty()
  @Type(() => Number) @IsNumber()
  valorUnitario: number;
}
