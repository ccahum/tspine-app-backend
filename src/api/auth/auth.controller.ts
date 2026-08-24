import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { LoginStepResponseDto } from './dto/login-step-response.dto';
import { MeResponseDto } from './dto/me-response.dto';
import { PendingTokenDto } from './dto/pending-token.dto';
import { VerificarCodigoDto } from './dto/verificar-codigo.dto';
import { TotpSetupResponseDto } from './dto/totp-setup-response.dto';
import { Public } from '@app/commons/decorators/public.decorator';
import { ProblemDetailsResponseDto } from '@app/commons/filters/problem-details.response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Paso 1: valida usuario/contraseña y devuelve si falta configurar o verificar el segundo factor (2FA)' })
  @ApiOkResponse({ type: LoginStepResponseDto })
  @ApiBadRequestResponse({ type: ProblemDetailsResponseDto })
  @ApiUnauthorizedResponse({ type: ProblemDetailsResponseDto })
  async login(@Body() dto: LoginDto): Promise<LoginStepResponseDto> {
    return this.authService.login(dto);
  }

  @Public()
  @Post('2fa/setup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Paso 2 (primera vez): genera el secreto y el QR para vincular Google Authenticator/Authy' })
  @ApiOkResponse({ type: TotpSetupResponseDto })
  @ApiUnauthorizedResponse({ type: ProblemDetailsResponseDto })
  async setupTotp(@Body() dto: PendingTokenDto): Promise<TotpSetupResponseDto> {
    return this.authService.iniciarSetupTotp(dto.pendingToken);
  }

  @Public()
  @Post('2fa/confirmar-setup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Paso 3 (primera vez): confirma el código mostrado por la app y activa el 2FA + emite el token de sesión' })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({ type: ProblemDetailsResponseDto })
  async confirmarSetupTotp(@Body() dto: VerificarCodigoDto): Promise<LoginResponseDto> {
    return this.authService.confirmarSetupTotp(dto.pendingToken, dto.codigo);
  }

  @Public()
  @Post('2fa/verificar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Paso 2 (2FA ya activo): valida el código de 6 dígitos y emite el token de sesión' })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({ type: ProblemDetailsResponseDto })
  async verificarCodigo(@Body() dto: VerificarCodigoDto): Promise<LoginResponseDto> {
    return this.authService.verificarCodigoLogin(dto.pendingToken, dto.codigo);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener usuario autenticado' })
  @ApiOkResponse({ type: MeResponseDto })
  @ApiUnauthorizedResponse({ type: ProblemDetailsResponseDto })
  async me(@Req() req: Request): Promise<MeResponseDto> {
    const user = req['user'] as { sub: string };
    return this.authService.me(user.sub);
  }
}
