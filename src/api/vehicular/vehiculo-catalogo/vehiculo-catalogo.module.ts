import { Module } from '@nestjs/common';
import { VehiculoCatalogoController } from './vehiculo-catalogo.controller';
import { VehiculoCatalogoService } from './vehiculo-catalogo.service';

@Module({
  controllers: [VehiculoCatalogoController],
  providers: [VehiculoCatalogoService],
})
export class VehiculoCatalogoModule {}
