import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUsuarioDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nombreCompleto?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  perfilId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sedeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @ApiPropertyOptional({ description: 'Si se envía, resetea la contraseña del usuario' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
