import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateViajeVehiculoDto {
  @ApiProperty({ description: 'ID del vehículo (VehiculoCatalogo)' })
  @IsString()
  @IsNotEmpty()
  vehiculoId!: string;

  @ApiProperty({ description: 'ID de la Sede' })
  @IsString()
  @IsNotEmpty()
  sedeId!: string;

  @ApiProperty()
  @Type(() => Number) @IsInt() @Min(0)
  kilometrajeActual!: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sitioDestino!: string;

  @ApiProperty({ description: 'Foto del tablero, codificada como data URL en base64' })
  @IsString()
  @IsNotEmpty()
  fotografia!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  diligencia!: string;

  @ApiPropertyOptional({ description: 'Coordenadas GPS capturadas al momento de agregar el viaje ("lat, lng")' })
  @IsOptional() @IsString()
  sitioOrigen?: string;

  @ApiPropertyOptional({ description: 'Descripción de la novedad (solo si el conductor marcó "Con novedades")' })
  @IsOptional() @IsString()
  novedadesEstado?: string;
}
