import { Module } from '@nestjs/common';
import { ProgramacionesController } from './programaciones.controller';
import { ProgramacionesService } from './programaciones.service';
import { ProgramacionesRepositoryService } from '@app/shared/repositories/programaciones/programaciones.repository.service';
import { ProgramacionesStatsRepositoryService } from '@app/shared/repositories/programaciones/programaciones-stats.repository.service';

@Module({
  controllers: [ProgramacionesController],
  providers: [ProgramacionesService, ProgramacionesRepositoryService, ProgramacionesStatsRepositoryService],
})
export class ProgramacionesModule {}
