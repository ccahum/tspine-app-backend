import { Module } from '@nestjs/common';
import { GoogleChatController } from './google-chat.controller';

@Module({
  controllers: [GoogleChatController],
})
export class GoogleChatModule {}
