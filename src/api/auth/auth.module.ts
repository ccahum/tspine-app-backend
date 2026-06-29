import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsuariosRepositoryService } from '@app/shared/repositories/usuarios/usuarios.repository.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, UsuariosRepositoryService],
})
export class AuthModule {}
