import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateFlagsDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() cerrada?: boolean;
}
