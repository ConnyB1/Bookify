import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat, ChatUsuario, Mensaje } from './chat.entity';
import { Usuario } from '../entities/user.entity';
import { Intercambio } from '../entities/exchange.entity';
import { Libro } from '../entities/book.entity';
import { CreateChatDto, SendMessageDto, ChatPreviewDto, MessageDto } from './chat.dto';
import { NotificationService } from '../notifications/notification.service'; // ✅ Ruta corregida

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(ChatUsuario)
    private chatUsuarioRepository: Repository<ChatUsuario>,
    @InjectRepository(Mensaje)
    private mensajeRepository: Repository<Mensaje>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Intercambio)
    private intercambioRepository: Repository<Intercambio>,
    @InjectRepository(Libro)
    private libroRepository: Repository<Libro>,
    private notificationService: NotificationService,
  ) {}

  async getUserChats(userId: number): Promise<ChatPreviewDto[]> {
    console.log(`[OPTIMIZADO] Obteniendo chats para usuario ${userId}`);
    const chatsWithData = await this.chatUsuarioRepository
      .createQueryBuilder('cu')
      .innerJoin('chat_usuario', 'cu_other', 'cu_other.id_chat = cu.id_chat AND cu_other.id_usuario != :userId', { userId })
      .innerJoin('usuario', 'other_user', 'other_user.id_usuario = cu_other.id_usuario')
      .leftJoin(
        (qb) =>
          qb
            .select('m.id_chat', 'chat_id')
            .addSelect('MAX(m.timestamp)', 'max_timestamp')
            .from(Mensaje, 'm')
            .groupBy('m.id_chat'),
        'last_msg_info',
        'last_msg_info.chat_id = cu.id_chat'
      )
      .leftJoin(
        'mensaje',
        'last_msg',
        'last_msg.id_chat = cu.id_chat AND last_msg.timestamp = last_msg_info.max_timestamp'
      )
      .select([
        'cu.id_chat AS id_chat',
        'other_user.id_usuario AS other_user_id',
        'other_user.nombre_usuario AS other_user_name',
        'other_user.email AS other_user_email',
        'other_user.foto_perfil_url AS other_user_photo',
        'COALESCE(last_msg.contenido_texto, \'Sin mensajes\') AS last_message',
        'COALESCE(last_msg.timestamp, CURRENT_TIMESTAMP) AS timestamp',
      ])
      .where('cu.id_usuario = :userId', { userId })
      .orderBy('timestamp', 'DESC')
      .getRawMany();

    console.log(`[OPTIMIZADO] ${chatsWithData.length} chats obtenidos en 1 query`);

    return chatsWithData.map((row) => ({
      id_chat: row.id_chat,
      otherUserId: row.other_user_id,
      otherUserName: row.other_user_name,
      otherUserEmail: row.other_user_email,
      otherUserPhoto: row.other_user_photo ?? undefined,
      lastMessage: row.last_message,
      timestamp: new Date(row.timestamp).toISOString(),
    }));
  }
  

  async getChatMessages(chatId: number, userId: number, limit = 200): Promise<MessageDto[]> {
    // Verificar que el usuario pertenece al chat
    const isMember = await this.chatUsuarioRepository.findOne({
      where: { id_chat: chatId, id_usuario: userId },
    });

    if (!isMember) {
      throw new BadRequestException('No tienes acceso a este chat');
    }

    const messages = await this.mensajeRepository.find({
      where: { id_chat: chatId },
      order: { timestamp: 'ASC' },
      take: limit,
      relations: ['emisor'],
    });

    return messages.map(m => ({
      id_mensaje: m.id_mensaje,
      id_chat: m.id_chat,
      id_usuario_emisor: m.id_usuario_emisor,
      contenido_texto: m.contenido_texto,
      timestamp: m.timestamp.toISOString(),
      emisor: {
        id_usuario: m.emisor.id_usuario,
        nombre_usuario: m.emisor.nombre_usuario,
        foto_perfil_url: m.emisor.foto_perfil_url ?? undefined,
      },
    }));
  }


  // ✅ ÚNICA VERSIÓN DE SEND MESSAGE (CON NOTIFICACIONES)
  async sendMessage(userId: number, dto: SendMessageDto): Promise<MessageDto> {
    // 1. Verificar membresía
    const isMember = await this.chatUsuarioRepository.findOne({
      where: { id_chat: dto.id_chat, id_usuario: userId },
    });

    if (!isMember) {
      throw new BadRequestException('No tienes acceso a este chat');
    }

    // 2. Guardar el mensaje
    const mensaje = this.mensajeRepository.create({
      id_chat: dto.id_chat,
      id_usuario_emisor: userId,
      contenido_texto: dto.contenido_texto,
    });

    const savedMessage = await this.mensajeRepository.save(mensaje);

    // 3. Lógica de Notificación Push (NUEVO)
    try {
      const chatParticipants = await this.chatUsuarioRepository.find({
        where: { id_chat: dto.id_chat },
        relations: ['usuario'],
      });

      const receptor = chatParticipants.find(p => p.id_usuario !== userId)?.usuario;
const emisor = await this.usuarioRepository.findOne({ where: { id_usuario: userId } });
      if (receptor && receptor.push_token) {
        const nombreMostrar = emisor?.nombre_usuario || 'Usuario Bookify'; 

        await this.notificationService.sendPushNotification(
          receptor.push_token,
          `Mensaje de ${nombreMostrar}`, 
          dto.contenido_texto,
          { chatId: dto.id_chat, type: 'chat_message' }
        );
      }
    } catch (error) {
      console.error('Error enviando push notification:', error);
    }

    // 4. Devolver el mensaje recién creado
    const fullMessage = await this.mensajeRepository.findOne({
      where: { id_mensaje: savedMessage.id_mensaje },
      relations: ['emisor'],
    });

    if (!fullMessage) {
      throw new Error('Error al obtener el mensaje guardado');
    }

    return {
      id_mensaje: fullMessage.id_mensaje,
      id_chat: fullMessage.id_chat,
      id_usuario_emisor: fullMessage.id_usuario_emisor,
      contenido_texto: fullMessage.contenido_texto,
      timestamp: fullMessage.timestamp.toISOString(),
      emisor: {
        id_usuario: fullMessage.emisor.id_usuario,
        nombre_usuario: fullMessage.emisor.nombre_usuario,
        foto_perfil_url: fullMessage.emisor.foto_perfil_url ?? undefined,
      },
    };
  }

  /**
   * Obtener solo el estado de confirmaciones y ubicación (query ligero para polling)
   * OPTIMIZADO: Un solo query con JOIN en lugar de dos queries separadas
   */
  async getChatExchangeStatus(chatId: number) {
    // Query única con JOIN entre chat e intercambio
    const result = await this.chatRepository
      .createQueryBuilder('chat')
      .innerJoin('intercambio', 'i', 'i.id_intercambio = chat.id_intercambio')
      .select([
        'i.id_intercambio',
        'i.id_libro_ofertado_fk',
        'i.confirmacion_solicitante',
        'i.confirmacion_receptor',
        'i.ubicacion_encuentro_lat',
        'i.ubicacion_encuentro_lng',
        'i.ubicacion_encuentro_nombre',
      ])
      .where('chat.id_chat = :chatId', { chatId })
      .andWhere('chat.id_intercambio IS NOT NULL')
      .getRawOne();

    if (!result) {
      return null;
    }

    return {
      id_intercambio: result.i_id_intercambio,
      id_libro_ofertado: result.i_id_libro_ofertado_fk,
      confirmacion_solicitante: result.i_confirmacion_solicitante,
      confirmacion_receptor: result.i_confirmacion_receptor,
      ubicacion_encuentro_lat: result.i_ubicacion_encuentro_lat,
      ubicacion_encuentro_lng: result.i_ubicacion_encuentro_lng,
      ubicacion_encuentro_nombre: result.i_ubicacion_encuentro_nombre,
    };
  }

  /**
   * Crear un nuevo chat entre dos usuarios
   */
  async createChat(dto: CreateChatDto): Promise<{ id_chat: number; message: string }> {
    console.log(`Intentando crear chat entre usuarios ${dto.id_usuario1} y ${dto.id_usuario2}`);
    
    // Verificar que los usuarios existen
    const user1 = await this.usuarioRepository.findOne({ 
      where: { id_usuario: dto.id_usuario1 } 
    });
    const user2 = await this.usuarioRepository.findOne({ 
      where: { id_usuario: dto.id_usuario2 } 
    });

    if (!user1 || !user2) {
      console.error(`Usuario no encontrado: user1=${!!user1}, user2=${!!user2}`);
      throw new NotFoundException('Uno o ambos usuarios no existen');
    }

    if (dto.id_usuario1 === dto.id_usuario2) {
      console.error('Intento de crear chat consigo mismo');
      throw new BadRequestException('No puedes crear un chat contigo mismo');
    }

    // Verificar si ya existe un chat entre estos usuarios
    const existingChat = await this.findExistingChat(dto.id_usuario1, dto.id_usuario2);
    if (existingChat) {
      console.log(`Chat ya existe: ${existingChat}`);
      return {
        id_chat: existingChat,
        message: 'Ya existe un chat entre estos usuarios',
      };
    }

    // Crear el chat
    const chat = this.chatRepository.create({
      id_intercambio: dto.id_intercambio || null,
    });

    const savedChat = await this.chatRepository.save(chat);
    console.log(`Chat creado con ID: ${savedChat.id_chat}`);

    // Asociar usuarios al chat
    await this.chatUsuarioRepository.save([
      { id_chat: savedChat.id_chat, id_usuario: dto.id_usuario1 },
      { id_chat: savedChat.id_chat, id_usuario: dto.id_usuario2 },
    ]);
    console.log(`Usuarios asociados al chat ${savedChat.id_chat}`);

    return {
      id_chat: savedChat.id_chat,
      message: 'Chat creado exitosamente',
    };
  }

  /**
   * Buscar chat existente entre dos usuarios
   * ⚡️ OPTIMIZADO: Un solo query con JOIN en lugar de N+1
   */
  private async findExistingChat(userId1: number, userId2: number): Promise<number | null> {
    // Query única que busca un id_chat donde AMBOS usuarios estén presentes
    const result = await this.chatUsuarioRepository
      .createQueryBuilder('cu1')
      .select('cu1.id_chat')
      // Unir la tabla consigo misma para buscar el otro usuario
      .innerJoin(
        'chat_usuario',
        'cu2',
        'cu1.id_chat = cu2.id_chat'
      )
      // cu1 debe ser el usuario 1 Y cu2 debe ser el usuario 2
      .where('cu1.id_usuario = :userId1', { userId1 })
      .andWhere('cu2.id_usuario = :userId2', { userId2 })
      .getRawOne();

    return result ? result.cu1_id_chat : null;
  }


  async getNewMessages(
    chatId: number, 
    userId: number, 
    sinceTimestamp: string
  ): Promise<MessageDto[]> {
    // Verificar que el usuario pertenece al chat
    const isMember = await this.chatUsuarioRepository.findOne({
      where: { id_chat: chatId, id_usuario: userId },
    });

    if (!isMember) {
      throw new BadRequestException('No tienes acceso a este chat');
    }

    const messages = await this.mensajeRepository
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.emisor', 'u')
      .where('m.id_chat = :chatId', { chatId })
      .andWhere('m.timestamp > :since', { since: sinceTimestamp })
      .orderBy('m.timestamp', 'ASC')
      .getMany();

    return messages.map(m => ({
      id_mensaje: m.id_mensaje,
      id_chat: m.id_chat,
      id_usuario_emisor: m.id_usuario_emisor,
      contenido_texto: m.contenido_texto,
      timestamp: m.timestamp.toISOString(),
      emisor: {
        id_usuario: m.emisor.id_usuario,
        nombre_usuario: m.emisor.nombre_usuario,
        foto_perfil_url: m.emisor.foto_perfil_url ?? undefined,
      },
    }));
  }

  /**
   * Obtener información del intercambio asociado a un chat
   * OPTIMIZADO: Un solo query con JOIN en lugar de dos queries separadas
   */
  async getChatExchange(chatId: number) {
    // Verificar que el chat tenga intercambio con un solo query
    const chatInfo = await this.chatRepository
      .createQueryBuilder('chat')
      .select(['chat.id_chat', 'chat.id_intercambio'])
      .where('chat.id_chat = :chatId', { chatId })
      .andWhere('chat.id_intercambio IS NOT NULL')
      .getOne();

    if (!chatInfo || !chatInfo.id_intercambio) {
      return null;
    }

    // Ahora sí, obtener el intercambio completo con todas sus relaciones
    const intercambio = await this.intercambioRepository.findOne({
      where: { id_intercambio: chatInfo.id_intercambio },
      relations: [
        'libro_solicitado',
        'libro_solicitado.imagenes',
        'libro_solicitado.propietario',
        'libro_ofertado',
        'libro_ofertado.imagenes',
        'libro_ofertado.propietario',
        'usuario_solicitante',
        'usuario_solicitante_receptor',
      ],
    });

    if (!intercambio) {
      return null;
    }

    return {
      id_intercambio: intercambio.id_intercambio,
      id_libro_solicitado: intercambio.id_libro_solicitado_fk,
      id_libro_ofertado: intercambio.id_libro_ofertado_fk,
      id_usuario_solicitante: intercambio.id_usuario_solicitante_fk,
      id_usuario_solicitante_receptor: intercambio.id_usuario_solicitante_receptor_fk,
      estado_propuesta: intercambio.estado_propuesta,
      // Campos de ubicación de encuentro
      ubicacion_encuentro_lat: intercambio.ubicacion_encuentro_lat,
      ubicacion_encuentro_lng: intercambio.ubicacion_encuentro_lng,
      ubicacion_encuentro_nombre: intercambio.ubicacion_encuentro_nombre,
      ubicacion_encuentro_direccion: intercambio.ubicacion_encuentro_direccion,
      ubicacion_encuentro_place_id: intercambio.ubicacion_encuentro_place_id,
      // Campos de confirmación bilateral
      confirmacion_solicitante: intercambio.confirmacion_solicitante,
      confirmacion_receptor: intercambio.confirmacion_receptor,
      // Nombres de usuarios
      nombre_usuario_solicitante: intercambio.usuario_solicitante.nombre_usuario,
      nombre_usuario_receptor: intercambio.usuario_solicitante_receptor.nombre_usuario,
      libro_solicitado: {
        id_libro: intercambio.libro_solicitado.id_libro,
        titulo: intercambio.libro_solicitado.titulo,
        autor: intercambio.libro_solicitado.autor,
        descripcion: intercambio.libro_solicitado.descripcion,
        imagenes: intercambio.libro_solicitado.imagenes.map(img => ({
          url_imagen: img.url_imagen,
        })),
        propietario: {
          id_usuario: intercambio.libro_solicitado.propietario.id_usuario,
          nombre_usuario: intercambio.libro_solicitado.propietario.nombre_usuario,
        },
      },
      libro_ofertado: intercambio.libro_ofertado ? {
        id_libro: intercambio.libro_ofertado.id_libro,
        titulo: intercambio.libro_ofertado.titulo,
        autor: intercambio.libro_ofertado.autor,
        descripcion: intercambio.libro_ofertado.descripcion,
        imagenes: intercambio.libro_ofertado.imagenes.map(img => ({
          url_imagen: img.url_imagen,
        })),
        propietario: {
          id_usuario: intercambio.libro_ofertado.propietario.id_usuario,
          nombre_usuario: intercambio.libro_ofertado.propietario.nombre_usuario,
        },
      } : null,
    };
  }

  /**
   * Verificar si un usuario pertenece a un chat
   */
  async verifyUserInChat(chatId: number, userId: number): Promise<boolean> {
    const member = await this.chatUsuarioRepository.findOne({
      where: { id_chat: chatId, id_usuario: userId },
    });
    return !!member;
  }

  /**
   * Obtener participantes del chat (excluyendo al usuario actual)
   */
  async getChatParticipants(chatId: number, currentUserId: number) {
    const participants = await this.chatUsuarioRepository
      .createQueryBuilder('cu')
      .leftJoinAndSelect('cu.usuario', 'u')
      .where('cu.id_chat = :chatId', { chatId })
      .andWhere('cu.id_usuario != :currentUserId', { currentUserId })
      .getMany();

    return participants.map(p => ({
      id_usuario: p.usuario.id_usuario,
      nombre_usuario: p.usuario.nombre_usuario,
      email: p.usuario.email,
      foto_perfil_url: p.usuario.foto_perfil_url ?? undefined,
    }));
  }
}