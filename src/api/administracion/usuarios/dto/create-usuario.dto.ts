import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUsuarioDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty()
  nombreCompleto: string;

  @ApiProperty({ example: 'jperez', description: 'Parte del correo antes del @ — el dominio se agrega automático' })
  @IsString()
  @IsNotEmpty()
  usuario: string;

  @ApiProperty({ example: 'Clave1234' })
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
