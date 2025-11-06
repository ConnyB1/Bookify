import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDto, SendMessageDto } from './chat.dto';

/**
 * Middleware simple de autenticación
 * TODO: Reemplazar con tu guard de autenticación real
 */
// @UseGuards(AuthGuard) // Descomenta cuando tengas tu AuthGuard
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * GET /api/chat/my-chats
   * Obtener todos los chats del usuario autenticado
   */
  @Get('my-chats')
  async getMyChats(@Request() req) {
    // TODO: Obtener userId del token de autenticación
    // Por ahora, asumimos que viene en req.user.id_usuario
    const userId = req.user?.id_usuario || req.query.userId;
    
    if (!userId) {
      return { 
        success: false, 
        message: 'Usuario no autenticado' 
      };
    }

    const chats = await this.chatService.getUserChats(Number(userId));
    
    return {
      success: true,
      data: chats,
    };
  }

  /**
   * GET /api/chat/:chatId/messages
   * Obtener mensajes de un chat específico
   */
  @Get(':chatId/messages')
  async getChatMessages(
    @Param('chatId') chatId: string,
    @Query('limit') limit: string,
    @Request() req,
  ) {
    const userId = req.user?.id_usuario || req.query.userId;
    
    if (!userId) {
      return { 
        success: false, 
        message: 'Usuario no autenticado' 
      };
    }

    const messages = await this.chatService.getChatMessages(
      Number(chatId),
      Number(userId),
      limit ? Number(limit) : 200,
    );

    return {
      success: true,
      data: messages,
    };
  }

  /**
   * POST /api/chat/send
   * Enviar un mensaje
   */
  @Post('send')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(@Body() dto: SendMessageDto, @Request() req) {
    const userId = req.user?.id_usuario || req.body.userId;
    
    if (!userId) {
      return { 
        success: false, 
        message: 'Usuario no autenticado' 
      };
    }

    const message = await this.chatService.sendMessage(Number(userId), dto);

    return {
      success: true,
      data: message,
      message: 'Mensaje enviado',
    };
  }

  /**
   * POST /api/chat/create
   * Crear un nuevo chat entre dos usuarios
   */
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async createChat(@Body() dto: CreateChatDto) {
    const result = await this.chatService.createChat(dto);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * GET /api/chat/:chatId/new-messages
   * Obtener mensajes nuevos desde un timestamp (para polling)
   */
  @Get(':chatId/new-messages')
  async getNewMessages(
    @Param('chatId') chatId: string,
    @Query('since') since: string,
    @Request() req,
  ) {
    const userId = req.user?.id_usuario || req.query.userId;
    
    if (!userId) {
      return { 
        success: false, 
        message: 'Usuario no autenticado' 
      };
    }

    if (!since) {
      return {
        success: false,
        message: 'Parámetro "since" es requerido',
      };
    }

    const messages = await this.chatService.getNewMessages(
      Number(chatId),
      Number(userId),
      since,
    );

    return {
      success: true,
      data: messages,
      count: messages.length,
    };
  }
}
