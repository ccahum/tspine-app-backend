import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { MeResponseDto } from './dto/me-response.dto';
import { UsuariosRepositoryService } from '@app/shared/repositories/usuarios/usuarios.repository.service';
import { Constants } from '@app/constants/constants';
import { LoggerExtensions } from '@app/commons/logger.extensions';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usuariosRepository: UsuariosRepositoryService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponseDto> {
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

    const payload = {
      sub: usuario.id,
      correo: usuario.correo,
      perfilId: usuario.perfilId,
      sedeId: usuario.sedeId,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    LoggerExtensions.writeInfo(this.logger, 'Login exitoso', {
      usuarioId: usuario.id,
      correo: usuario.correo,
    });

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
}
