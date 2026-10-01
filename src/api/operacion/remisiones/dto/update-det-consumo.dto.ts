import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateDetConsumoDto {
  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsNumber() @IsPositive()
  cantidad?: number;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsNumber() @IsPositive()
  valorUnitario?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  observaciones?: string;
}
