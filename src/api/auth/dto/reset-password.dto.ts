import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { Constants } from '@app/constants/constants';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token recibido por correo (parámetro ?token= del link)' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @Matches(Constants.Auth.PASSWORD_REGEX, { message: Constants.Auth.PASSWORD_REGEX_MESSAGE })
  nuevaPassword: string;
}
