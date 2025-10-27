import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Libro } from '../entities/book.entity';
import { Genero } from '../entities/genero.entity';
import { LibroImagen } from '../entities/libro-imagen.entity';
import { CreateBookDto } from './dto/book.dto';

@Injectable()
export class BookService {
  constructor(
    @InjectRepository(Libro)
    private bookRepository: Repository<Libro>,
    @InjectRepository(Genero)
    private generoRepository: Repository<Genero>,
    @InjectRepository(LibroImagen)
    private libroImagenRepository: Repository<LibroImagen>,
  ) {}

  async findAll(): Promise<Libro[]> {
    const libros = await this.bookRepository.find({
      relations: ['propietario', 'generos', 'imagenes'],
    });

    console.log(`[DEBUG] Libros encontrados en la DB: ${libros.length}`);
    if (libros.length > 0) {
        console.log("[DEBUG] Primer libro devuelto:", libros[0]);
        console.log("[DEBUG] Imágenes del primer libro:", libros[0].imagenes);
    }
    
    return libros;
  }

  async create(createBookDto: CreateBookDto): Promise<Libro> {
    const { generos, imagenes, id_usuario, ...bookData } = createBookDto;

    // Crear el libro
    const libro = this.bookRepository.create({
      ...bookData,
      id_propietario: id_usuario,
    });

    // Manejar géneros si existen
    if (generos && generos.length > 0) {
      const generosEntities: Genero[] = [];
      
      for (const generoNombre of generos) {
        let genero = await this.generoRepository.findOne({
          where: { nombre: generoNombre }
        });
        
        // Si el género no existe, crearlo
        if (!genero) {
          genero = this.generoRepository.create({ nombre: generoNombre });
          await this.generoRepository.save(genero);
        }
        
        generosEntities.push(genero);
      }
      
      libro.generos = generosEntities;
    }

    // Guardar el libro
    const savedBook = await this.bookRepository.save(libro);

    // Guardar las imágenes en la tabla libro_imagen
    if (imagenes && imagenes.length > 0) {
      console.log('[DEBUG] Imágenes a guardar:', imagenes);
      
      const imagenesEntities: LibroImagen[] = [];
      for (const imagenUrl of imagenes) {
        const imagen = this.libroImagenRepository.create({
          id_libro: savedBook.id_libro,
          url_imagen: imagenUrl,
        });
        imagenesEntities.push(imagen);
      }
      
      const savedImages = await this.libroImagenRepository.save(imagenesEntities);
      console.log('[DEBUG] Imágenes guardadas:', savedImages);
      savedBook.imagenes = savedImages;
    }

    return savedBook;
  }

  async findById(id: number): Promise<Libro | null> {
    return await this.bookRepository.findOne({
      where: { id_libro: id },
      relations: ['propietario', 'generos', 'imagenes'],
    });
  }

  async findByUser(userId: number): Promise<Libro[]> {
    return await this.bookRepository.find({
      where: { id_propietario: userId },
      relations: ['generos', 'imagenes'],
    });
  }
}
