import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateTecnicoSugeridoDto {
  @ApiProperty({ description: 'ID de la programación' })
  @IsString()
  programacionId!: string;

  @ApiProperty({ description: 'ID del Tercero (técnico/comisionista) sugerido' })
  @IsString()
  tecnicoId!: string;
}
