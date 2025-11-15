import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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

  async findAll(userId?: number): Promise<any[]> {
    // 🎯 FEATURE FLAG: Desactiva el filtro de proximidad cambiando FEATURES.PROXIMITY_FILTER_ENABLED a false
    if (!FEATURES.PROXIMITY_FILTER_ENABLED) {
      console.log('[DEBUG] ⚠️ Filtro de proximidad DESACTIVADO globalmente - retornando todos los libros');
      const libros = await this.bookRepository.find({
        relations: ['propietario', 'generos', 'imagenes'],
      });
      return libros;
    }

    // Si no hay userId, retornar todos los libros (comportamiento original)
    if (!userId) {
      console.log('[DEBUG] Sin userId - retornando todos los libros');
      const libros = await this.bookRepository.find({
        relations: ['propietario', 'generos', 'imagenes'],
      });
      return libros;
    }

    // Obtener la ubicación del usuario que hace la búsqueda
    const usuario = await this.usuarioRepository.findOne({
      where: { id_usuario: userId },
    });

    // Si el usuario no tiene ubicación configurada, retornar todos
    if (!usuario || !usuario.latitud || !usuario.longitud) {
      console.log('[DEBUG] Usuario sin ubicación configurada - retornando todos los libros');
      const libros = await this.bookRepository.find({
        relations: ['propietario', 'generos', 'imagenes'],
      });
      return libros;
    }

    console.log(`[DEBUG] Usuario ${userId} busca desde: ${usuario.ciudad} (${usuario.latitud}, ${usuario.longitud})`);
    console.log(`[DEBUG] Radio de búsqueda: ${usuario.radio_busqueda_km} km`);

    // 🚀 Consulta OPTIMIZADA con ST_DWithin (usa índices espaciales)
    // ST_DWithin es mucho más rápido que ST_Distance porque:
    // 1. Aprovecha índices GiST/SP-GiST de PostGIS
    // 2. Solo evalúa puntos dentro del radio (no calcula todas las distancias)
    // 3. Retorna boolean, no float (más eficiente)
    
    // Primero, obtener los IDs de libros dentro del radio con sus distancias
    const librosConDistanciaRaw = await this.bookRepository
      .createQueryBuilder('libro')
      .innerJoin('libro.propietario', 'propietario')
      .select('libro.id_libro', 'id_libro')
      .addSelect(
        `ROUND(
          CAST(
            ST_Distance(
              ST_MakePoint(propietario.longitud, propietario.latitud)::geography,
              ST_MakePoint(:userLng, :userLat)::geography
            ) / 1000 AS NUMERIC
          ), 1
        )`,
        'distancia_km',
      )
      .where('propietario.latitud IS NOT NULL')
      .andWhere('propietario.longitud IS NOT NULL')
      .andWhere(
        `ST_DWithin(
          ST_MakePoint(propietario.longitud, propietario.latitud)::geography,
          ST_MakePoint(:userLng, :userLat)::geography,
          :radiusMeters
        )`,
      )
      .setParameters({
        userLat: usuario.latitud,
        userLng: usuario.longitud,
        radiusMeters: usuario.radio_busqueda_km * 1000,
      })
      .orderBy('distancia_km', 'ASC')
      .getRawMany();

    console.log(`[DEBUG] Libros encontrados dentro del radio (${usuario.radio_busqueda_km} km): ${librosConDistanciaRaw.length}`);

    if (librosConDistanciaRaw.length === 0) {
      return [];
    }

    // Crear mapa de distancias
    const distanciaMap = new Map<number, number>();
    const libroIds = librosConDistanciaRaw.map(row => {
      distanciaMap.set(parseInt(row.id_libro), parseFloat(row.distancia_km));
      return parseInt(row.id_libro);
    });

    // Obtener los libros completos con sus relaciones
    const libros = await this.bookRepository.find({
      where: { id_libro: In(libroIds) },
      relations: ['propietario', 'generos', 'imagenes'],
    });

    // Mapear con distancias y ordenar
    const librosConDistancia = libros
      .map((libro) => ({
        ...libro,
        distancia_km: distanciaMap.get(libro.id_libro) || 0,
      }))
      .sort((a, b) => a.distancia_km - b.distancia_km);

    if (librosConDistancia.length > 0) {
      console.log('[DEBUG] Primer libro con distancia:', {
        titulo: librosConDistancia[0].titulo,
        distancia: librosConDistancia[0].distancia_km,
        propietario: librosConDistancia[0].propietario.nombre_usuario,
        coords_propietario: {
          lat: librosConDistancia[0].propietario.latitud,
          lng: librosConDistancia[0].propietario.longitud,
        },
        coords_usuario: {
          lat: usuario.latitud,
          lng: usuario.longitud,
        },
      });
      
      // 🔍 DEBUG: Mostrar todos los libros con sus distancias
      console.log('[DEBUG] Todos los libros encontrados:');
      librosConDistancia.forEach((libro, i) => {
        console.log(`  ${i + 1}. "${libro.titulo}" - ${libro.distancia_km} km (${libro.propietario.latitud}, ${libro.propietario.longitud})`);
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
}
