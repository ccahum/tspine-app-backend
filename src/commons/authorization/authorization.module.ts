import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SuperAdminGuard } from './guards/super-admin.guard';
import { PerfilAccessGuard } from './guards/perfil-access.guard';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '8h') as any },
      }),
    }),
  ],
  providers: [JwtAuthGuard, SuperAdminGuard, PerfilAccessGuard],
  exports: [JwtAuthGuard, SuperAdminGuard, PerfilAccessGuard, JwtModule],
})
export class AuthorizationModule {}
