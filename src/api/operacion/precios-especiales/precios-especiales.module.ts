import { Module } from '@nestjs/common';
import { PreciosEspecialesController } from './precios-especiales.controller';
import { PreciosEspecialesService } from './precios-especiales.service';

@Module({
  controllers: [PreciosEspecialesController],
  providers: [PreciosEspecialesService],
})
export class PreciosEspecialesModule {}
