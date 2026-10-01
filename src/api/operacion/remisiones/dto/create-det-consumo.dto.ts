import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, IsPositive } from 'class-validator';

export class CreateDetConsumoDto {
  @ApiProperty()
  @IsString()
  productoId!: string;

  @ApiProperty()
  @Type(() => Number) @IsNumber() @IsPositive()
  cantidad!: number;

  @ApiProperty()
  @Type(() => Number) @IsNumber() @IsPositive()
  valorUnitario!: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  observaciones?: string;
}
