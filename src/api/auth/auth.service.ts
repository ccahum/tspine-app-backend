import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'node:crypto';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { LoginStepResponseDto } from './dto/login-step-response.dto';
import { MeResponseDto } from './dto/me-response.dto';
import { TotpSetupResponseDto } from './dto/totp-setup-response.dto';
import { UsuariosRepositoryService } from '@app/shared/repositories/usuarios/usuarios.repository.service';
import { PrismaService } from '@app/prisma/prisma.service';
import { Constants } from '@app/constants/constants';
import { LoggerExtensions } from '@app/commons/logger.extensions';
import { encryptTotpSecret, decryptTotpSecret } from '@app/commons/crypto/totp-crypto.util';
import { MailerService } from '@app/commons/mailer/mailer.service';
import { buildBrandedEmailHtml, emailButtonHtml } from '@app/commons/mailer/email-template.util';

const PENDING_TOKEN_EXPIRES_IN = '10m';
const TOTP_ISSUER = 'Luminar';
const MAX_INTENTOS_CODIGO = 5;
const MAX_INTENTOS_LOGIN = 5;
const BLOQUEO_LOGIN_MINUTOS = 15;
const SALT_ROUNDS = 10;
const RESET_TOKEN_EXPIRES_MINUTOS = 10;
// Evita que alguien reenvíe el formulario y sature el correo del usuario con links repetidos.
const RESET_TOKEN_COOLDOWN_MINUTOS = 2;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usuariosRepository: UsuariosRepositoryService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailer: MailerService,
  ) {}

  async login(dto: LoginDto): Promise<LoginStepResponseDto> {
    const correo = `${dto.usuario}@${Constants.Auth.EMAIL_DOMAIN}`;
    const usuario = await this.usuariosRepository.findByCorreo(correo);

    if (!usuario || !usuario.passwordHash) {
      LoggerExtensions.writeWarning(this.logger, 'Intento de login con usuario no registrado', {
        usuario: dto.usuario,
      });
      throw new UnauthorizedException(Constants.Error.INVALID_CREDENTIALS);
    }

    if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
      const minutosRestantes = Math.ceil((usuario.bloqueadoHasta.getTime() - Date.now()) / 60000);
      LoggerExtensions.writeWarning(this.logger, 'Login rechazado por cuenta bloqueada', { usuarioId: usuario.id });
      throw new UnauthorizedException(`Cuenta bloqueada temporalmente, intenta de nuevo en ${minutosRestantes} min`);
    }

    const passwordValido = await bcrypt.compare(dto.password, usuario.passwordHash);

    if (!passwordValido) {
      const intentos = usuario.intentosFallidosLogin + 1;
      const seBloquea = intentos >= MAX_INTENTOS_LOGIN;

      await this.prisma.tercero.update({
        where: { id: usuario.id },
        data: {
          intentosFallidosLogin: seBloquea ? 0 : intentos,
          bloqueadoHasta: seBloquea ? new Date(Date.now() + BLOQUEO_LOGIN_MINUTOS * 60000) : null,
        },
      });

      LoggerExtensions.writeWarning(this.logger, 'Contraseña incorrecta en login', {
        usuario: dto.usuario,
        intentos,
        bloqueado: seBloquea,
      });

      if (seBloquea) {
        throw new UnauthorizedException(
          `Cuenta bloqueada temporalmente, intenta de nuevo en ${BLOQUEO_LOGIN_MINUTOS} min`,
        );
      }
      throw new UnauthorizedException(Constants.Error.INVALID_CREDENTIALS);
    }

    if (usuario.intentosFallidosLogin > 0 || usuario.bloqueadoHasta) {
      await this.prisma.tercero.update({
        where: { id: usuario.id },
        data: { intentosFallidosLogin: 0, bloqueadoHasta: null },
      });
    }

    if (!usuario.activo) {
      LoggerExtensions.writeWarning(this.logger, 'Intento de login con usuario desactivado', {
        usuarioId: usuario.id,
      });
      throw new UnauthorizedException(Constants.Error.USER_INACTIVE);
    }

    const totp = await this.prisma.terceroTotp.findUnique({ where: { terceroId: usuario.id } });

    // Cada vez que se vuelve a pasar usuario/contraseña se le da al usuario un cupo nuevo de
    // intentos para el código 2FA — así el bloqueo por fuerza bruta no queda pegado para siempre.
    if (totp && totp.intentosFallidos > 0) {
      await this.prisma.terceroTotp.update({ where: { terceroId: usuario.id }, data: { intentosFallidos: 0 } });
    }

    const pendingToken = await this.jwtService.signAsync(
      { sub: usuario.id, type: 'PENDING_2FA' },
      { expiresIn: PENDING_TOKEN_EXPIRES_IN },
    );

    if (usuario.debeCambiarPassword) {
      LoggerExtensions.writeInfo(this.logger, 'Login válido, requiere cambio de contraseña inicial', {
        usuarioId: usuario.id,
      });
      return { estado: 'REQUIERE_CAMBIO_PASSWORD', pendingToken };
    }

    LoggerExtensions.writeInfo(this.logger, 'Usuario/contraseña válidos, pendiente segundo factor', {
      usuarioId: usuario.id,
    });

    return {
      estado: totp?.activado ? 'REQUIERE_CODIGO' : 'REQUIERE_CONFIGURAR_2FA',
      pendingToken,
    };
  }

  async cambiarPasswordInicial(pendingToken: string, nuevaPassword: string): Promise<LoginStepResponseDto> {
    const usuarioId = await this.verificarPendingToken(pendingToken);
    const usuario = await this.usuariosRepository.findById(usuarioId);

    if (!usuario) {
      throw new NotFoundException(Constants.Error.USER_NOT_FOUND);
    }

    const nuevoHash = await bcrypt.hash(nuevaPassword, SALT_ROUNDS);
    await this.prisma.tercero.update({
      where: { id: usuarioId },
      data: { passwordHash: nuevoHash, debeCambiarPassword: false },
    });

    LoggerExtensions.writeInfo(this.logger, 'Contraseña inicial cambiada por el usuario', { usuarioId });

    const totp = await this.prisma.terceroTotp.findUnique({ where: { terceroId: usuarioId } });

    return {
      estado: totp?.activado ? 'REQUIERE_CODIGO' : 'REQUIERE_CONFIGURAR_2FA',
      pendingToken,
    };
  }

  // Respuesta siempre genérica (no lanza si el usuario no existe) para no revelar por esta vía
  // qué nombres de usuario están registrados en el sistema.
  async olvidePassword(usuario: string): Promise<void> {
    const correo = `${usuario}@${Constants.Auth.EMAIL_DOMAIN}`;
    const tercero = await this.usuariosRepository.findByCorreo(correo);

    if (!tercero || !tercero.passwordHash) {
      LoggerExtensions.writeInfo(this.logger, 'Olvidé-password para usuario inexistente o sin cuenta', { usuario });
      return;
    }

    if (tercero.resetTokenEmitidoEn && Date.now() - tercero.resetTokenEmitidoEn.getTime() < RESET_TOKEN_COOLDOWN_MINUTOS * 60000) {
      LoggerExtensions.writeInfo(this.logger, 'Olvidé-password ignorado por cooldown', { usuarioId: tercero.id });
      return;
    }

    const tokenPlano = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(tokenPlano).digest('hex');
    const emitidoEn = new Date();
    const expira = new Date(emitidoEn.getTime() + RESET_TOKEN_EXPIRES_MINUTOS * 60000);

    await this.prisma.tercero.update({
      where: { id: tercero.id },
      data: { resetTokenHash: tokenHash, resetTokenExpira: expira, resetTokenEmitidoEn: emitidoEn },
    });

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${tokenPlano}`;

    const bodyHtml = `
      <p style="margin:0 0 12px;">Hola ${tercero.nombreCompleto},</p>
      <p style="margin:0 0 4px;">Recibimos una solicitud para restablecer tu contraseña de Luminar. Este link es válido por ${RESET_TOKEN_EXPIRES_MINUTOS} minutos:</p>
      ${emailButtonHtml(resetUrl, 'Restablecer contraseña')}
      <p style="margin:0 0 12px; word-break:break-all; font-size:0.78rem; color:#8a8a7e;">${resetUrl}</p>
      <p style="margin:0; font-size:0.85rem; color:#8a8a7e;">Si tú no solicitaste esto, puedes ignorar este correo — tu contraseña actual sigue funcionando.</p>
    `;

    await this.mailer.enviarCorreo({
      to: correo,
      subject: 'Restablece tu contraseña — Luminar',
      html: buildBrandedEmailHtml({
        preheader: 'Link para restablecer tu contraseña de Luminar',
        bodyHtml,
        logoUrl: `${frontendUrl}/luminar-logo-v1.png`,
      }),
    });

    LoggerExtensions.writeInfo(this.logger, 'Correo de recuperación de contraseña enviado', { usuarioId: tercero.id });
  }

  async resetPassword(tokenPlano: string, nuevaPassword: string): Promise<void> {
    const tokenHash = createHash('sha256').update(tokenPlano).digest('hex');
    const tercero = await this.prisma.tercero.findFirst({ where: { resetTokenHash: tokenHash } });

    if (!tercero || !tercero.resetTokenExpira || tercero.resetTokenExpira < new Date()) {
      throw new UnauthorizedException('El link de recuperación no es válido o ya expiró');
    }

    const nuevoHash = await bcrypt.hash(nuevaPassword, SALT_ROUNDS);
    await this.prisma.tercero.update({
      where: { id: tercero.id },
      data: {
        passwordHash: nuevoHash,
        resetTokenHash: null,
        resetTokenExpira: null,
        resetTokenEmitidoEn: null,
        debeCambiarPassword: false,
        intentosFallidosLogin: 0,
        bloqueadoHasta: null,
      },
    });

    LoggerExtensions.writeInfo(this.logger, 'Contraseña restablecida vía link de recuperación', { usuarioId: tercero.id });
  }

  async iniciarSetupTotp(pendingToken: string): Promise<TotpSetupResponseDto> {
    const usuarioId = await this.verificarPendingToken(pendingToken);
    const usuario = await this.usuariosRepository.findById(usuarioId);

    if (!usuario || !usuario.correo) {
      throw new NotFoundException(Constants.Error.USER_NOT_FOUND);
    }

    const secret = authenticator.generateSecret();

    await this.prisma.terceroTotp.upsert({
      where: { terceroId: usuarioId },
      create: { terceroId: usuarioId, secreto: encryptTotpSecret(secret), activado: false },
      update: { secreto: encryptTotpSecret(secret), activado: false, intentosFallidos: 0 },
    });

    const otpauthUri = authenticator.keyuri(usuario.correo, TOTP_ISSUER, secret);
    const qrDataUrl = await QRCode.toDataURL(otpauthUri);

    return { qrDataUrl, secret };
  }

  async confirmarSetupTotp(pendingToken: string, codigo: string): Promise<LoginResponseDto> {
    const usuarioId = await this.verificarPendingToken(pendingToken);
    const totp = await this.prisma.terceroTotp.findUnique({ where: { terceroId: usuarioId } });

    if (!totp) {
      throw new UnauthorizedException('Primero debes generar el código QR');
    }

    if (totp.intentosFallidos >= MAX_INTENTOS_CODIGO) {
      throw new UnauthorizedException('Demasiados intentos fallidos, vuelve a iniciar sesión');
    }

    const secretValido = authenticator.verify({ token: codigo, secret: decryptTotpSecret(totp.secreto) });
    if (!secretValido) {
      await this.prisma.terceroTotp.update({
        where: { terceroId: usuarioId },
        data: { intentosFallidos: { increment: 1 } },
      });
      throw new UnauthorizedException('Código inválido');
    }

    await this.prisma.terceroTotp.update({
      where: { terceroId: usuarioId },
      data: { activado: true, intentosFallidos: 0 },
    });

    LoggerExtensions.writeInfo(this.logger, '2FA activado', { usuarioId });

    return this.emitirAccessToken(usuarioId);
  }

  async verificarCodigoLogin(pendingToken: string, codigo: string): Promise<LoginResponseDto> {
    const usuarioId = await this.verificarPendingToken(pendingToken);
    const totp = await this.prisma.terceroTotp.findUnique({ where: { terceroId: usuarioId } });

    if (!totp?.activado) {
      throw new UnauthorizedException('Este usuario no tiene el segundo factor configurado');
    }

    if (totp.intentosFallidos >= MAX_INTENTOS_CODIGO) {
      LoggerExtensions.writeWarning(this.logger, 'Bloqueado por intentos fallidos de 2FA', { usuarioId });
      throw new UnauthorizedException('Demasiados intentos fallidos, vuelve a iniciar sesión');
    }

    const codigoValido = authenticator.verify({ token: codigo, secret: decryptTotpSecret(totp.secreto) });
    if (!codigoValido) {
      await this.prisma.terceroTotp.update({
        where: { terceroId: usuarioId },
        data: { intentosFallidos: { increment: 1 } },
      });
      LoggerExtensions.writeWarning(this.logger, 'Código 2FA inválido', { usuarioId });
      throw new UnauthorizedException('Código inválido');
    }

    if (totp.intentosFallidos > 0) {
      await this.prisma.terceroTotp.update({ where: { terceroId: usuarioId }, data: { intentosFallidos: 0 } });
    }

    LoggerExtensions.writeInfo(this.logger, 'Login exitoso', { usuarioId });

    return this.emitirAccessToken(usuarioId);
  }

  async me(userId: string): Promise<MeResponseDto> {
    const usuario = await this.usuariosRepository.findById(userId);

    if (!usuario) {
      throw new NotFoundException(Constants.Error.USER_NOT_FOUND);
    }

    return {
      id: usuario.id,
      nombreCompleto: usuario.nombreCompleto,
      correo: usuario.correo,
      perfilId: usuario.perfilId,
      perfilNombre: (usuario as any).perfil?.nombre ?? '',
      reglas: (usuario as any).perfil?.reglas ?? '',
      sedeId: usuario.sedeId,
    };
  }

  private async verificarPendingToken(pendingToken: string): Promise<string> {
    try {
      const payload = await this.jwtService.verifyAsync(pendingToken);
      if (payload?.type !== 'PENDING_2FA' || !payload?.sub) {
        throw new UnauthorizedException(Constants.Error.AUTHORIZATION_TOKEN_INVALID);
      }
      return payload.sub as string;
    } catch {
      throw new UnauthorizedException(Constants.Error.AUTHORIZATION_TOKEN_INVALID);
    }
  }

  private async emitirAccessToken(usuarioId: string): Promise<LoginResponseDto> {
    const usuario = await this.usuariosRepository.findById(usuarioId);
    if (!usuario) {
      throw new NotFoundException(Constants.Error.USER_NOT_FOUND);
    }

    const payload = {
      sub: usuario.id,
      correo: usuario.correo,
      perfilId: usuario.perfilId,
      sedeId: usuario.sedeId,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      usuario: {
        id: usuario.id,
        nombreCompleto: usuario.nombreCompleto,
        correo: usuario.correo,
        perfilId: usuario.perfilId,
        perfilNombre: (usuario as any).perfil?.nombre ?? '',
        reglas: (usuario as any).perfil?.reglas ?? '',
        sedeId: usuario.sedeId,
      },
    };
  }
}
