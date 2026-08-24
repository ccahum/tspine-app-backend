import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthorizationModule } from './commons/authorization/authorization.module';
import { JwtAuthGuard } from './commons/authorization/guards/jwt-auth.guard';
import { AuthModule } from './api/auth/auth.module';
import { ProgramacionesModule } from './api/operacion/programaciones/programaciones.module';
import { RemisionesModule } from './api/operacion/remisiones/remisiones.module';
import { ListasPrecioModule } from './api/operacion/listas-precio/listas-precio.module';
import { PreciosEspecialesModule } from './api/operacion/precios-especiales/precios-especiales.module';
import { CotizacionesModule } from './api/operacion/cotizaciones/cotizaciones.module';
import { AutorizacionConsumosModule } from './api/operacion/autorizacion-consumos/autorizacion-consumos.module';
import { GoogleChatModule } from './api/integrations/google-chat/google-chat.module';
import { BusquedaGlobalModule } from './api/busqueda-global/busqueda-global.module';
import { SolicitudProgramacionModule } from './api/operacion/solicitud-programacion/solicitud-programacion.module';
import { NotificacionesModule } from './api/notificaciones/notificaciones.module';
import { UsuariosAdminModule } from './api/administracion/usuarios/usuarios-admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthorizationModule,
    AuthModule,
    ProgramacionesModule,
    RemisionesModule,
    ListasPrecioModule,
    PreciosEspecialesModule,
    CotizacionesModule,
    AutorizacionConsumosModule,
    GoogleChatModule,
    BusquedaGlobalModule,
    SolicitudProgramacionModule,
    NotificacionesModule,
    UsuariosAdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
