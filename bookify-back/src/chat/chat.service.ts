import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat, ChatUsuario, Mensaje } from './chat.entity';
import { Usuario } from '../entities/user.entity';
import { CreateChatDto, SendMessageDto, ChatPreviewDto, MessageDto } from './chat.dto';

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
  ) {}

  /**
   * Obtener todos los chats de un usuario con preview
   */
  async getUserChats(userId: number): Promise<ChatPreviewDto[]> {
    console.log(`Obteniendo chats para usuario ${userId}`);
    
    // Obtener IDs de chats donde participa el usuario
    const userChats = await this.chatUsuarioRepository.find({
      where: { id_usuario: userId },
    });

    console.log(`Usuario participa en ${userChats.length} chats`);

    const chatIds = userChats.map(uc => uc.id_chat);

    if (chatIds.length === 0) {
      console.log(`No hay chats para mostrar`);
      return [];
    }

    console.log(`IDs de chats: ${chatIds.join(', ')}`);

    const chatPreviews: ChatPreviewDto[] = [];

    for (const chatId of chatIds) {
      const otherUsers = await this.chatUsuarioRepository
        .createQueryBuilder('cu')
        .leftJoinAndSelect('cu.usuario', 'u')
        .where('cu.id_chat = :chatId', { chatId })
        .andWhere('cu.id_usuario != :userId', { userId })
        .getMany();

      if (otherUsers.length === 0) {
        console.log(`Chat ${chatId} no tiene otro usuario`);
        continue;
      }

      const otherUser = otherUsers[0].usuario;
      console.log(`Chat ${chatId} con usuario: ${otherUser.nombre_usuario}`);

      // Obtener último mensaje
      const lastMessage = await this.mensajeRepository.findOne({
        where: { id_chat: chatId },
        order: { timestamp: 'DESC' },
      });

      chatPreviews.push({
        id_chat: chatId,
        otherUserId: otherUser.id_usuario,
        otherUserName: otherUser.nombre_usuario,
        otherUserEmail: otherUser.email,
        otherUserPhoto: otherUser.foto_perfil_url ?? undefined,
        lastMessage: lastMessage?.contenido_texto || 'Sin mensajes',
        timestamp: lastMessage?.timestamp?.toISOString() || new Date().toISOString(),
      });
    }

    // Ordenar por timestamp más reciente
    chatPreviews.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return chatPreviews;
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


  async sendMessage(userId: number, dto: SendMessageDto): Promise<MessageDto> {
    // Verificar que el usuario pertenece al chat
    const isMember = await this.chatUsuarioRepository.findOne({
      where: { id_chat: dto.id_chat, id_usuario: userId },
    });

    if (!isMember) {
      throw new BadRequestException('No tienes acceso a este chat');
    }

    // Crear el mensaje
    const mensaje = this.mensajeRepository.create({
      id_chat: dto.id_chat,
      id_usuario_emisor: userId,
      contenido_texto: dto.contenido_texto,
    });

    const savedMessage = await this.mensajeRepository.save(mensaje);

    // Obtener el mensaje completo con relaciones
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

  private async findExistingChat(userId1: number, userId2: number): Promise<number | null> {
    const chatsUser1 = await this.chatUsuarioRepository.find({
      where: { id_usuario: userId1 },
    });

    for (const chat of chatsUser1) {
      const hasUser2 = await this.chatUsuarioRepository.findOne({
        where: { id_chat: chat.id_chat, id_usuario: userId2 },
      });

      if (hasUser2) {
        return chat.id_chat;
      }
    }

    return null;
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
}
