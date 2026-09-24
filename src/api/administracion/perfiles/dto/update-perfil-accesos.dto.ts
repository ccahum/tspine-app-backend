import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdatePerfilAccesosDto {
  @ApiProperty()
  @IsBoolean()
  accesoRestringido: boolean;

  @ApiPropertyOptional({ nullable: true, description: 'Vista a la que se redirige tras iniciar sesión — debe estar incluida en "vistas"' })
  @IsOptional()
  @IsString()
  vistaInicial?: string | null;

  @ApiProperty({ type: [String], description: 'Lista de ids de submódulo (paths del frontend) del catálogo de vistas' })
  @IsArray()
  @IsString({ each: true })
  vistas: string[];
}
