import { Module } from '@nestjs/common';
import { BusquedaGlobalController } from './busqueda-global.controller';
import { BusquedaGlobalService } from './busqueda-global.service';

@Module({
  controllers: [BusquedaGlobalController],
  providers: [BusquedaGlobalService],
})
export class BusquedaGlobalModule {}
