import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { Constants } from '@app/constants/constants';

export class CambiarPasswordInicialDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  pendingToken: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @Matches(Constants.Auth.PASSWORD_REGEX, { message: Constants.Auth.PASSWORD_REGEX_MESSAGE })
  nuevaPassword: string;
}
