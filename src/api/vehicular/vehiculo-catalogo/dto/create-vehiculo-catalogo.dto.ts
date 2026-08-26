import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateVehiculoCatalogoDto {
  @ApiProperty({ description: 'Placas del vehículo (se usa también como ID)' })
  @IsString()
  @IsNotEmpty()
  placas!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  marca!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  modelo!: string;

  @ApiProperty({ description: 'Foto del vehículo, codificada como data URL en base64' })
  @IsString()
  @IsNotEmpty()
  fotografia!: string;

  @ApiProperty()
  @Type(() => Number) @IsInt() @Min(0)
  kmActual!: number;

  @ApiProperty({ description: 'ID de la Sede' })
  @IsString()
  @IsNotEmpty()
  sedeId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  estado!: string;
}
