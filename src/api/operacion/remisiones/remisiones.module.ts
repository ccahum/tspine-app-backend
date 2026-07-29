import { Module } from '@nestjs/common';
import { RemisionesController } from './remisiones.controller';
import { RemisionesService } from './remisiones.service';
import { RemisionesRepositoryService } from '@app/shared/repositories/remisiones/remisiones.repository.service';

@Module({
  controllers: [RemisionesController],
  providers: [RemisionesService, RemisionesRepositoryService],
})
export class RemisionesModule {}
