import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Libro } from '../entities/book.entity'; 
import { Genero } from '../entities/genero.entity';
import { LibroImagen } from '../entities/libro-imagen.entity';
import { BookService } from './book.service';
import { BookController } from './book.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Libro, Genero, LibroImagen])],
  controllers: [BookController],
  providers: [BookService],
})
export class BookModule {} 