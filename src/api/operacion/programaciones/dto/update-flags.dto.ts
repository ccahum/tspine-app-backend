import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateFlagsDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() sinRemision?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() consumoNoValidado?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() sinComision?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() cerrada?: boolean;
}
