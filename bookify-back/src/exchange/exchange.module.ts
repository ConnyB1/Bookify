import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExchangeController } from './exchange.controller';
import { ExchangeService } from './exchange.service';
import { Intercambio } from '../entities/exchange.entity';
import { Libro } from '../entities/book.entity';
import { Usuario } from '../entities/user.entity';
import { Notificacion } from '../entities/notification.entity';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Intercambio, Libro, Usuario, Notificacion]),
    ChatModule, // Importar ChatModule para crear chats automáticamente
  ],
  controllers: [ExchangeController],
  providers: [ExchangeService],
  exports: [ExchangeService],
})
export class ExchangeModule {}
