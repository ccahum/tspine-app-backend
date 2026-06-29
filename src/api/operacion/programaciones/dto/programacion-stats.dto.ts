import { ApiProperty } from '@nestjs/swagger';

export class ProgramacionSedeStatDto {
  @ApiProperty() sede: string;
  @ApiProperty() total: number;
}

export class ProgramacionStatsDto {
  @ApiProperty() total: number;
  @ApiProperty() sinRemision: number;
  @ApiProperty() consumoNoValidado: number;
  @ApiProperty() sinComision: number;
  @ApiProperty() cerradas: number;
  @ApiProperty({ type: [ProgramacionSedeStatDto] }) porSede: ProgramacionSedeStatDto[];
  @ApiProperty() programacionesAño?: number;
  @ApiProperty() programacionesMes?: number;
}
