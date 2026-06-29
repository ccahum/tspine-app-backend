import { ApiProperty } from '@nestjs/swagger';

export class MonthComparisonDto {
  @ApiProperty({ type: Object, example: { '0': 5, '1': 8, '2': 12 } })
  months: Record<number, number>;

  @ApiProperty()
  year: number;
}

export class ProgramacionComparisonResponseDto {
  @ApiProperty({ type: [MonthComparisonDto] })
  data: MonthComparisonDto[];
}
