"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const usuarios_repository_service_1 = require("../../shared/repositories/usuarios/usuarios.repository.service");
const constants_1 = require("../../constants/constants");
const logger_extensions_1 = require("../../commons/logger.extensions");
let AuthService = AuthService_1 = class AuthService {
    usuariosRepository;
    jwtService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(usuariosRepository, jwtService) {
        this.usuariosRepository = usuariosRepository;
        this.jwtService = jwtService;
    }
    async login(dto) {
        const usuario = await this.usuariosRepository.findByCorreo(dto.correo);
        if (!usuario || !usuario.passwordHash) {
            logger_extensions_1.LoggerExtensions.writeWarning(this.logger, 'Intento de login con correo no registrado', {
                correo: dto.correo,
            });
            throw new common_1.UnauthorizedException(constants_1.Constants.Error.INVALID_CREDENTIALS);
        }
        const passwordValido = await bcrypt.compare(dto.password, usuario.passwordHash);
        if (!passwordValido) {
            logger_extensions_1.LoggerExtensions.writeWarning(this.logger, 'Contraseña incorrecta en login', {
                correo: dto.correo,
            });
            throw new common_1.UnauthorizedException(constants_1.Constants.Error.INVALID_CREDENTIALS);
        }
        const payload = {
            sub: usuario.id,
            correo: usuario.correo,
            perfilId: usuario.perfilId,
            sedeId: usuario.sedeId,
        };
        const accessToken = await this.jwtService.signAsync(payload);
        logger_extensions_1.LoggerExtensions.writeInfo(this.logger, 'Login exitoso', {
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
                perfilNombre: usuario.perfil?.nombre ?? '',
                reglas: usuario.perfil?.reglas ?? '',
                sedeId: usuario.sedeId,
            },
        };
    }
    async me(userId) {
        const usuario = await this.usuariosRepository.findById(userId);
        if (!usuario) {
            throw new common_1.NotFoundException(constants_1.Constants.Error.USER_NOT_FOUND);
        }
        return {
            id: usuario.id,
            nombreCompleto: usuario.nombreCompleto,
            correo: usuario.correo,
            perfilId: usuario.perfilId,
            perfilNombre: usuario.perfil?.nombre ?? '',
            reglas: usuario.perfil?.reglas ?? '',
            sedeId: usuario.sedeId,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [usuarios_repository_service_1.UsuariosRepositoryService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map