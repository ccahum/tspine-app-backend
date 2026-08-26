import { Module } from '@nestjs/common';
import { TercerosAdminController } from './terceros-admin.controller';
import { TercerosAdminService } from './terceros-admin.service';

@Module({
  controllers: [TercerosAdminController],
  providers: [TercerosAdminService],
})
export class TercerosAdminModule {}
