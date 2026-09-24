import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDetCotizaDto {
  @ApiProperty()
  @IsString()
  productoId: string;

  @ApiProperty()
  @Type(() => Number) @IsNumber()
  cantidad: number;

  @ApiProperty()
  @Type(() => Number) @IsNumber()
  valorUnitario: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  observaciones?: string;

  @ApiPropertyOptional({ description: 'Hospital actualmente seleccionado en el formulario, que puede no coincidir todavía con el guardado en la cotización (ej. si se cambió el hospital en Editar y aún no se guarda) — si se manda, se usa este para resolver nombre/referencia especial en vez del hospital ya guardado.' })
  @IsOptional() @IsString()
  hospitalId?: string;
}
