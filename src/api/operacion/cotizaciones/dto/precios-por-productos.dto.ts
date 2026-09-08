import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class PreciosPorProductosDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  productoIds: string[];

  @ApiProperty()
  @IsString()
  tarifaId: string;
}
