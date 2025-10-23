import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Libro } from '../entities/book.entity';

@Injectable()
export class BookService {
  constructor(
    @InjectRepository(Libro)
    private bookRepository: Repository<Libro>,
  ) {}

  async findAll(): Promise<Libro[]> {
    const libros = await this.bookRepository.find({
      relations: ['propietario'],
    });

    console.log(`[DEBUG] Libros encontrados en la DB: ${libros.length}`);
    if (libros.length > 0) {
        console.log("[DEBUG] Primer libro devuelto:", libros[0]);
    }
    
    return libros;
  }
}
