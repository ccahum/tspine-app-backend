import { Module } from '@nestjs/common';
import { ViajeVehiculoController } from './viaje-vehiculo.controller';
import { ViajeVehiculoService } from './viaje-vehiculo.service';

@Module({
  controllers: [ViajeVehiculoController],
  providers: [ViajeVehiculoService],
})
export class ViajeVehiculoModule {}
