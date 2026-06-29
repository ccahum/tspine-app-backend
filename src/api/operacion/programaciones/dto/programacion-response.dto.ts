import { ApiProperty } from '@nestjs/swagger';

export class ProgramacionListItemDto {
  @ApiProperty() id: string;
  @ApiProperty() idLegacy: string | null;
  @ApiProperty() fechaQx: Date | null;
  @ApiProperty() horaQx: string | null;
  @ApiProperty() sede: string | null;
  @ApiProperty() ciudad: string | null;
  @ApiProperty() medicos: string[];
  @ApiProperty() hospital: string | null;
  @ApiProperty() observaciones: string | null;
  @ApiProperty() avance: number | null;
  @ApiProperty() sinRemision: boolean;
  @ApiProperty() consumoNoValidado: boolean;
  @ApiProperty() sinComision: boolean;
  @ApiProperty() cerrada: boolean;
}

export class ProgramacionListResponseDto {
  @ApiProperty({ type: [ProgramacionListItemDto] })
  data: ProgramacionListItemDto[];

  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}
