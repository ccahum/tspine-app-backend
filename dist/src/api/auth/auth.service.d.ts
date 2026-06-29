import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { MeResponseDto } from './dto/me-response.dto';
import { UsuariosRepositoryService } from "../../shared/repositories/usuarios/usuarios.repository.service";
export declare class AuthService {
    private readonly usuariosRepository;
    private readonly jwtService;
    private readonly logger;
    constructor(usuariosRepository: UsuariosRepositoryService, jwtService: JwtService);
    login(dto: LoginDto): Promise<LoginResponseDto>;
    me(userId: string): Promise<MeResponseDto>;
}
