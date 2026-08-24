import { Module } from '@nestjs/common';
import { SolicitudProgramacionController } from './solicitud-programacion.controller';
import { SolicitudProgramacionService } from './solicitud-programacion.service';
import { ProgramacionesRepositoryService } from '@app/shared/repositories/programaciones/programaciones.repository.service';
import { NotificacionesService } from '@app/shared/services/notificaciones.service';

@Module({
  controllers: [SolicitudProgramacionController],
  providers: [SolicitudProgramacionService, ProgramacionesRepositoryService, NotificacionesService],
})
export class SolicitudProgramacionModule {}
