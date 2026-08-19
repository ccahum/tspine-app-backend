import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ESTADOS_REMISION } from './update-estado.dto';

export class RemisionQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 300 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 300;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ESTADOS_REMISION })
  @IsOptional() @IsIn(ESTADOS_REMISION)
  estado?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'CXC? — false = Pendiente, true = Enviada' })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : value === true || value === 'true'))
  @IsBoolean()
  cxc?: boolean;
}
