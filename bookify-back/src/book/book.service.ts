import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Libro } from '../entities/book.entity';
import { Genero } from '../entities/genero.entity';
import { LibroImagen } from '../entities/libro-imagen.entity';
import { Usuario } from '../entities/user.entity';
import { FEATURES } from '../config/features.config';
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
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
  ) {}

  /**
   * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine
   * @param lat1 Latitud del punto 1
   * @param lon1 Longitud del punto 1
   * @param lat2 Latitud del punto 2
   * @param lon2 Longitud del punto 2
   * @returns Distancia en kilómetros
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en kilómetros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 10) / 10; // Redondear a 1 decimal
  }

  async findAll(userId?: number): Promise<any[]> {
    const libros = await this.bookRepository.find({
      relations: ['propietario', 'generos', 'imagenes'],
    });

    console.log(`[DEBUG] Libros encontrados en la DB: ${libros.length}`);
    
    // 🎯 FEATURE FLAG: Desactiva el filtro de proximidad cambiando FEATURES.PROXIMITY_FILTER_ENABLED a false
    if (!FEATURES.PROXIMITY_FILTER_ENABLED) {
      console.log('[DEBUG] ⚠️ Filtro de proximidad DESACTIVADO globalmente - retornando todos los libros');
      return libros;
    }

    // Si no hay userId, retornar todos los libros (comportamiento original)
    if (!userId) {
      console.log('[DEBUG] Sin userId - retornando todos los libros');
      return libros;
    }

    // Obtener la ubicación del usuario que hace la búsqueda
    const usuario = await this.usuarioRepository.findOne({
      where: { id_usuario: userId },
    });

    // Si el usuario no existe o no tiene ubicación configurada, retornar todos
    if (!usuario || !usuario.latitud || !usuario.longitud) {
      console.log('[DEBUG] Usuario sin ubicación configurada - retornando todos los libros');
      return libros;
    }

    console.log(`[DEBUG] Usuario ${userId} busca desde: ${usuario.ciudad} (${usuario.latitud}, ${usuario.longitud})`);
    console.log(`[DEBUG] Radio de búsqueda: ${usuario.radio_busqueda_km} km`);

    // Filtrar libros por proximidad
    const librosConDistancia = libros
      .map(libro => {
        // Si el propietario no tiene ubicación, no incluir el libro
        if (!libro.propietario.latitud || !libro.propietario.longitud) {
          return null;
        }

        // Calcular distancia (usamos ! porque ya verificamos que no son null arriba)
        const distancia = this.calculateDistance(
          usuario.latitud!,
          usuario.longitud!,
          libro.propietario.latitud,
          libro.propietario.longitud,
        );

        return {
          ...libro,
          distancia_km: distancia,
        };
      })
      .filter(libro => libro !== null) // Eliminar libros sin ubicación
      .filter(libro => libro.distancia_km <= usuario.radio_busqueda_km) // Filtrar por radio
      .sort((a, b) => a.distancia_km - b.distancia_km); // Ordenar por distancia (más cercanos primero)

    console.log(`[DEBUG] Libros dentro del radio (${usuario.radio_busqueda_km} km): ${librosConDistancia.length}`);
    
    if (librosConDistancia.length > 0) {
      console.log('[DEBUG] Primer libro con distancia:', {
        titulo: librosConDistancia[0].titulo,
        distancia: librosConDistancia[0].distancia_km,
        propietario: librosConDistancia[0].propietario.nombre_usuario,
      });
    }
    
    return librosConDistancia;
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

  async delete(id: number): Promise<void> {
    // Primero eliminar las imágenes asociadas
    await this.libroImagenRepository.delete({ id_libro: id });
    
    // Luego eliminar el libro (las relaciones con géneros se manejan automáticamente con cascade)
    await this.bookRepository.delete({ id_libro: id });
  }
}
