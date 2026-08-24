import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerificarCodigoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  pendingToken: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  codigo: string;
}
