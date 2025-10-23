import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Usuario } from './entities/user.entity';
import { Libro } from './entities/book.entity';
import { Genero } from './entities/genero.entity';
import { PuntoEncuentro } from './entities/location.entity';
import { Intercambio } from './entities/exchange.entity';

import { BookModule } from './book/book.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT ?? '5432', 10), 
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      
      entities: [
        Usuario, 
        Libro, 
        Genero, 
        PuntoEncuentro, 
        Intercambio
      ], 
      
      synchronize: true,
    }),

    BookModule,
  ],
  controllers: [], 
  providers: [], 
})
export class AppModule {}