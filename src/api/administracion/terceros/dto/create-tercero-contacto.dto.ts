import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export const TIPOS_CONTACTO = ['Teléfono', 'Celular', 'Correo', 'Dirección'] as const;

export class CreateTerceroContactoDto {
  @ApiProperty({ enum: TIPOS_CONTACTO })
  @IsString() @IsIn(TIPOS_CONTACTO)
  tipo!: string;

  @ApiProperty()
  @IsString() @IsNotEmpty()
  dato!: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  personaContacto?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  notas?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional() @IsBoolean()
  principal?: boolean;
}
