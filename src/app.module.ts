import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthorizationModule } from './commons/authorization/authorization.module';
import { JwtAuthGuard } from './commons/authorization/guards/jwt-auth.guard';
import { AuthModule } from './api/auth/auth.module';
import { ProgramacionesModule } from './api/operacion/programaciones/programaciones.module';
import { RemisionesModule } from './api/operacion/remisiones/remisiones.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthorizationModule,
    AuthModule,
    ProgramacionesModule,
    RemisionesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
