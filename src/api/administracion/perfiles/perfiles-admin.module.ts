import { Module } from '@nestjs/common';
import { PerfilesAdminController } from './perfiles-admin.controller';
import { PerfilesAdminService } from './perfiles-admin.service';

@Module({
  controllers: [PerfilesAdminController],
  providers: [PerfilesAdminService],
})
export class PerfilesAdminModule {}
