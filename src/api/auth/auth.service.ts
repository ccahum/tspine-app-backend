import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
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

const PENDING_TOKEN_EXPIRES_IN = '10m';
const TOTP_ISSUER = 'Luminar';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usuariosRepository: UsuariosRepositoryService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
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

    const passwordValido = await bcrypt.compare(dto.password, usuario.passwordHash);

    if (!passwordValido) {
      LoggerExtensions.writeWarning(this.logger, 'Contraseña incorrecta en login', {
        usuario: dto.usuario,
      });
      throw new UnauthorizedException(Constants.Error.INVALID_CREDENTIALS);
    }

    if (!usuario.activo) {
      LoggerExtensions.writeWarning(this.logger, 'Intento de login con usuario desactivado', {
        usuarioId: usuario.id,
      });
      throw new UnauthorizedException(Constants.Error.USER_INACTIVE);
    }

    const totp = await this.prisma.terceroTotp.findUnique({ where: { terceroId: usuario.id } });
    const pendingToken = await this.jwtService.signAsync(
      { sub: usuario.id, type: 'PENDING_2FA' },
      { expiresIn: PENDING_TOKEN_EXPIRES_IN },
    );

    LoggerExtensions.writeInfo(this.logger, 'Usuario/contraseña válidos, pendiente segundo factor', {
      usuarioId: usuario.id,
    });

    return {
      estado: totp?.activado ? 'REQUIERE_CODIGO' : 'REQUIERE_CONFIGURAR_2FA',
      pendingToken,
    };
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
      update: { secreto: encryptTotpSecret(secret), activado: false },
    });

    const baseUri = authenticator.keyuri(usuario.correo, TOTP_ISSUER, secret);
    // El parámetro "image" es una extensión de facto (no forma parte del RFC 6238) que apps como
    // Authy sí respetan para mostrar un ícono junto a la cuenta — requiere una URL pública con
    // HTTPS, así que solo se agrega si TOTP_ICON_URL está configurada (ver .env.app.example).
    const iconUrl = process.env.TOTP_ICON_URL;
    const otpauthUri = iconUrl ? `${baseUri}&image=${encodeURIComponent(iconUrl)}` : baseUri;
    const qrDataUrl = await QRCode.toDataURL(otpauthUri);

    return { qrDataUrl, secret };
  }

  async confirmarSetupTotp(pendingToken: string, codigo: string): Promise<LoginResponseDto> {
    const usuarioId = await this.verificarPendingToken(pendingToken);
    const totp = await this.prisma.terceroTotp.findUnique({ where: { terceroId: usuarioId } });

    if (!totp) {
      throw new UnauthorizedException('Primero debes generar el código QR');
    }

    const secretValido = authenticator.verify({ token: codigo, secret: decryptTotpSecret(totp.secreto) });
    if (!secretValido) {
      throw new UnauthorizedException('Código inválido');
    }

    await this.prisma.terceroTotp.update({ where: { terceroId: usuarioId }, data: { activado: true } });

    LoggerExtensions.writeInfo(this.logger, '2FA activado', { usuarioId });

    return this.emitirAccessToken(usuarioId);
  }

  async verificarCodigoLogin(pendingToken: string, codigo: string): Promise<LoginResponseDto> {
    const usuarioId = await this.verificarPendingToken(pendingToken);
    const totp = await this.prisma.terceroTotp.findUnique({ where: { terceroId: usuarioId } });

    if (!totp?.activado) {
      throw new UnauthorizedException('Este usuario no tiene el segundo factor configurado');
    }

    const codigoValido = authenticator.verify({ token: codigo, secret: decryptTotpSecret(totp.secreto) });
    if (!codigoValido) {
      LoggerExtensions.writeWarning(this.logger, 'Código 2FA inválido', { usuarioId });
      throw new UnauthorizedException('Código inválido');
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
