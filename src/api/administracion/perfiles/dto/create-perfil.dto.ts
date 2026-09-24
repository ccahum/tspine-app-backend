import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MinLength } from 'class-validator';
import { ReglaCrud } from '@prisma/client';

export class CreatePerfilDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  nombre: string;

  @ApiProperty({ enum: ReglaCrud })
  @IsEnum(ReglaCrud)
  reglas: ReglaCrud;
}
