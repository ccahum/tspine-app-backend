import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional({ description: 'Igual que en CreateDetCotizaDto: si se manda, se usa este hospital (en vez del que ya tenía guardado el ítem) para resolver nombre/referencia especial.' })
  @IsOptional()
  @IsString()
  hospitalId?: string;
}
