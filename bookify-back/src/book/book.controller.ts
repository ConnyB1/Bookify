import { Controller, Get, Post, Body, Param, BadRequestException, Query } from '@nestjs/common';
import { BookService } from './book.service';
import type { CreateBookDto } from './dto/book.dto';
import { Libro } from '../entities/book.entity';

@Controller('api/books') 
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Get()
  async getAllBooks(
    @Query('userId') userId?: string,
  ): Promise<{ success: boolean; data: any[]; message: string }> {
    try {
      const userIdNumber = userId ? parseInt(userId, 10) : undefined;
      const books = await this.bookService.findAll(userIdNumber);
      
      const message = userIdNumber 
        ? `Libros obtenidos con filtro de proximidad (${books.length} encontrados)`
        : 'Libros obtenidos exitosamente';
      
      return {
        success: true,
        data: books,
        message,
      };
    } catch (error) {
      throw new BadRequestException(`Error al obtener libros: ${error.message}`);
    }
  }

  @Get(':id')
  async getBookById(@Param('id') id: number): Promise<Libro> {
    const book = await this.bookService.findById(id);
    if (!book) {
      throw new BadRequestException('Libro no encontrado');
    }
    return book;
  }

  @Post()
  async createBook(@Body() createBookDto: CreateBookDto): Promise<{ success: boolean; data: Libro; message: string }> {
    try {
      console.log('[DEBUG] Datos recibidos para crear libro:', createBookDto);
      console.log('[DEBUG] id_usuario recibido:', createBookDto.id_usuario);
      
      if (!createBookDto.titulo || !createBookDto.autor) {
        throw new BadRequestException('Título y autor son requeridos');
      }

      if (!createBookDto.id_usuario) {
        throw new BadRequestException('El ID de usuario es requerido');
      }

      const book = await this.bookService.create(createBookDto);
      
      console.log('[DEBUG] Libro creado con id_propietario:', book.id_propietario);
      
      return {
        success: true,
        data: book,
        message: 'Libro creado exitosamente',
      };
    } catch (error) {
      throw new BadRequestException(`Error al crear libro: ${error.message}`);
    }
  }

  @Get('user/:userId')
  async getBooksByUser(@Param('userId') userId: number): Promise<Libro[]> {
    return this.bookService.findByUser(userId);
  }
}

