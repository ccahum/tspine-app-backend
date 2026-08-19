import { Module } from '@nestjs/common';
import { AutorizacionConsumosController } from './autorizacion-consumos.controller';
import { AutorizacionConsumosService } from './autorizacion-consumos.service';

@Module({
  controllers: [AutorizacionConsumosController],
  providers: [AutorizacionConsumosService],
})
export class AutorizacionConsumosModule {}
