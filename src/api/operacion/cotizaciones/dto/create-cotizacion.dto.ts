import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCotizacionDto {
  @ApiProperty()
  @IsDateString()
  fecha!: string;

  @ApiProperty()
  @IsString()
  dirigidoA!: string;

  @ApiPropertyOptional({ description: 'Nombres de los médicos, separados por coma' })
  @IsOptional() @IsString()
  medico?: string;

  @ApiProperty()
  @IsString()
  hospitalId!: string;

  @ApiProperty()
  @IsString()
  cirugia!: string;

  @ApiProperty({ description: 'ID de la Tarifa que representa el Cubrimiento (Particulares/Hospitales/Distribuidor/Aseguradora)' })
  @IsString()
  cubrimientoId!: string;

  @ApiProperty({ description: 'ID del Tercero empresa (clasificación EMPRESA)' })
  @IsString()
  empresaId!: string;

  @ApiProperty({ description: 'ID del Tercero responsable económico' })
  @IsString()
  responsableEconomicoId!: string;

  @ApiProperty({ description: 'ID de la Sede — por defecto la del perfil del usuario que crea la cotización, pero puede cambiarse' })
  @IsString()
  sedeId!: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  numProveedor?: string;

  @ApiPropertyOptional({ description: 'ID de la Tarifa (por defecto, igual al cubrimiento elegido)' })
  @IsOptional() @IsString()
  tarifaId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  tiempoEntrega?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  observaciones?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  paqueteId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  nivel?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean()
  tieneDcto?: boolean;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsNumber()
  porcentajeDcto?: number;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsNumber()
  vrDctoPesos?: number;

  @ApiProperty()
  @IsString()
  impuestos!: string;
}
