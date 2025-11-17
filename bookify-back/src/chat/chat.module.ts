import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Chat, ChatUsuario, Mensaje } from './chat.entity';
import { Usuario } from '../entities/user.entity';
import { Intercambio } from '../entities/exchange.entity';
import { Libro } from '../entities/book.entity';
import { AuthModule } from '../auth/auth.module'; // Importar AuthModule

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat, ChatUsuario, Mensaje, Usuario, Intercambio, Libro]),
    AuthModule, // Importar para tener acceso al JwtAuthGuard
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
