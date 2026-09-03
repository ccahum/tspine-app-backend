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
import { CambiarPasswordInicialDto } from './dto/cambiar-password-inicial.dto';
import { OlvidePasswordDto } from './dto/olvide-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
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
  @Post('cambiar-password-inicial')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Paso 1.5 (solo si el estado es REQUIERE_CAMBIO_PASSWORD): cambia la contraseña asignada por un admin antes de continuar con el 2FA' })
  @ApiOkResponse({ type: LoginStepResponseDto })
  @ApiUnauthorizedResponse({ type: ProblemDetailsResponseDto })
  async cambiarPasswordInicial(@Body() dto: CambiarPasswordInicialDto): Promise<LoginStepResponseDto> {
    return this.authService.cambiarPasswordInicial(dto.pendingToken, dto.nuevaPassword);
  }

  @Public()
  @Post('olvide-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Envía un link de recuperación por correo si el usuario existe (respuesta siempre genérica)' })
  async olvidePassword(@Body() dto: OlvidePasswordDto): Promise<{ mensaje: string }> {
    await this.authService.olvidePassword(dto.usuario);
    return { mensaje: 'Si el usuario existe, se envió un correo con instrucciones para restablecer la contraseña' };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restablece la contraseña usando el token recibido por correo' })
  @ApiUnauthorizedResponse({ type: ProblemDetailsResponseDto })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ mensaje: string }> {
    await this.authService.resetPassword(dto.token, dto.nuevaPassword);
    return { mensaje: 'Contraseña actualizada correctamente' };
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
