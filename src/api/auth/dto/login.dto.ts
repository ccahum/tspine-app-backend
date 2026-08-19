import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'ccahum' })
  @IsString()
  @IsNotEmpty()
  usuario: string;

  @ApiProperty({ example: '********' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
