import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RecalcularPreciosDto {
  @ApiProperty()
  @IsString()
  tarifaId: string;
}
