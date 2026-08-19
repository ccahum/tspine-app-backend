import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CotizacionQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 300 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 300;

  @ApiPropertyOptional({ description: 'Busca por N° cotización, hospital, médico, usuario, empresa o cirugía' })
  @IsOptional() @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  dateTo?: string;
}
