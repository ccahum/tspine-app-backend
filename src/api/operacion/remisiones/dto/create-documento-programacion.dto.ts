import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDocumentoProgramacionDto {
  @ApiProperty({ description: 'Programación a la que pertenece el documento' })
  @IsString()
  @IsNotEmpty()
  programacionId!: string;

  @ApiProperty({ description: 'Nombre del documento' })
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @ApiProperty({ description: 'Archivo PDF codificado como data URL en base64' })
  @IsString()
  @IsNotEmpty()
  documento!: string;
}
