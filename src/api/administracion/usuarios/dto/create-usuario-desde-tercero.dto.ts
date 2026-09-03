import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUsuarioDesdeTerceroDto {
  @ApiProperty({ description: 'ID del Tercero (con clasificación EMPLEADO) al que se le va a dar acceso' })
  @IsString()
  @IsNotEmpty()
  terceroId: string;

  @ApiProperty({ example: 'jperez', description: 'Parte del correo antes del @ — el dominio se agrega automático' })
  @IsString()
  @IsNotEmpty()
  usuario: string;

  // Contraseña temporal asignada por el admin — no requiere ser compleja porque el usuario
  // debe reemplazarla por una propia en su primer login (debeCambiarPassword: true).
  @ApiProperty({ example: 'Clave1234', description: 'Contraseña temporal — el usuario la reemplaza en su primer login' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'SA' })
  @IsString()
  @IsNotEmpty()
  perfilId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sedeId?: string;
}
