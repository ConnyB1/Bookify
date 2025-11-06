import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Chat, ChatUsuario, Mensaje } from './chat.entity';
import { Usuario } from '../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat, ChatUsuario, Mensaje, Usuario]),
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
