import { Module } from '@nestjs/common';
import { ListasPrecioController } from './listas-precio.controller';
import { ListasPrecioService } from './listas-precio.service';

@Module({
  controllers: [ListasPrecioController],
  providers: [ListasPrecioService],
})
export class ListasPrecioModule {}
