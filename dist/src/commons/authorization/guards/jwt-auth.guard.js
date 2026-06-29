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
var JwtAuthGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const jwt_1 = require("@nestjs/jwt");
const public_decorator_1 = require("../../decorators/public.decorator");
const constants_1 = require("../../../constants/constants");
const logger_extensions_1 = require("../../logger.extensions");
let JwtAuthGuard = JwtAuthGuard_1 = class JwtAuthGuard {
    reflector;
    jwtService;
    logger = new common_1.Logger(JwtAuthGuard_1.name);
    constructor(reflector, jwtService) {
        this.reflector = reflector;
        this.jwtService = jwtService;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic)
            return true;
        const request = context.switchToHttp().getRequest();
        const token = this.extractToken(request);
        if (!token) {
            throw new common_1.UnauthorizedException(constants_1.Constants.Error.AUTHORIZATION_HEADER_NOT_PROVIDED);
        }
        try {
            const payload = await this.jwtService.verifyAsync(token);
            request['user'] = payload;
            logger_extensions_1.LoggerExtensions.writeDebug(this.logger, 'JWT validado correctamente', {
                userId: payload.sub,
                perfilId: payload.perfilId,
            });
            return true;
        }
        catch {
            logger_extensions_1.LoggerExtensions.writeWarning(this.logger, 'JWT inválido o expirado', {
                path: request.path,
                method: request.method,
            });
            throw new common_1.UnauthorizedException(constants_1.Constants.Error.AUTHORIZATION_TOKEN_INVALID);
        }
    }
    extractToken(request) {
        const authHeader = request.headers.authorization;
        if (!authHeader?.startsWith('Bearer '))
            return null;
        return authHeader.split(' ')[1];
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = JwtAuthGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        jwt_1.JwtService])
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map