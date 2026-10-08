import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class NombresPorProductosDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  productoIds: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hospitalId?: string;
}
