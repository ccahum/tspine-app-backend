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

  // Igual que en create-usuario-desde-tercero.dto: es temporal, el usuario la reemplaza
  // en su próximo login (debeCambiarPassword se fuerza a true si se envía este campo).
  @ApiPropertyOptional({ description: 'Si se envía, resetea la contraseña del usuario (temporal — la reemplaza en su próximo login)' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
