import { Controller, Get } from '@nestjs/common';
import { BookService } from './book.service';
import { Libro } from '../entities/book.entity';

@Controller('books') 
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Get()
  async getAllBooks(): Promise<Libro[]> {
    return this.bookService.findAll();
  }
}

