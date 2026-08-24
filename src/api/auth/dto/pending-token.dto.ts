import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class PendingTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  pendingToken: string;
}
