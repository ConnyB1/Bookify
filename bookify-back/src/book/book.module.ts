import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Libro } from '../entities/book.entity'; 
import { BookService } from './book.service';
import { BookController } from './book.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Libro])],
  controllers: [BookController],
  providers: [BookService],
})
export class BookModule {} 