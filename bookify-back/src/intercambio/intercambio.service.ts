import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Intercambio, EstadoPropuesta } from '../entities/exchange.entity';
import { Libro, EstadoLibro } from '../entities/book.entity';
import { Usuario } from '../entities/user.entity';
import { Notificacion, TipoNotificacion } from '../entities/notification.entity';
import { CreateExchangeDto, UpdateExchangeDto, ExchangeResponseDto } from './intercambio.dto';
import { ChatService } from '../chat/chat.service';

@Injectable()
export class ExchangeService {
  constructor(
    @InjectRepository(Intercambio)
    private intercambioRepository: Repository<Intercambio>,
    @InjectRepository(Libro)
    private libroRepository: Repository<Libro>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Notificacion)
    private notificacionRepository: Repository<Notificacion>,
    private chatService: ChatService,
  ) {}

  /**
   * Crear solicitud de intercambio
   */
  async createExchangeRequest(dto: CreateExchangeDto): Promise<ExchangeResponseDto> {
    // Verificar que el libro existe
    const libro = await this.libroRepository.findOne({
      where: { id_libro: dto.id_libro_solicitado },
      relations: ['propietario'],
    });

    if (!libro) {
      throw new NotFoundException('Libro no encontrado');
    }

    // Verificar que no sea el mismo usuario
    if (libro.propietario.id_usuario === dto.id_usuario_solicitante) {
      throw new BadRequestException('No puedes solicitar intercambio de tu propio libro');
    }

    // Crear intercambio
    const intercambio = this.intercambioRepository.create({
      id_libro_solicitado_fk: dto.id_libro_solicitado,
      id_libro_ofertado_fk: dto.id_libro_ofertado || null,
      id_usuario_solicitante_fk: dto.id_usuario_solicitante,
      id_usuario_solicitante_receptor_fk: libro.propietario.id_usuario,
      estado_propuesta: EstadoPropuesta.PENDING,
    });

    const savedIntercambio = await this.intercambioRepository.save(intercambio);

    // Crear notificación para el propietario del libro
    const solicitante = await this.usuarioRepository.findOne({
      where: { id_usuario: dto.id_usuario_solicitante },
    });

    const notificacion = this.notificacionRepository.create({
      id_usuario_receptor: libro.propietario.id_usuario,
      id_usuario_emisor: dto.id_usuario_solicitante,
      id_intercambio: savedIntercambio.id_intercambio,
      tipo: TipoNotificacion.SOLICITUD_INTERCAMBIO,
      mensaje: `${solicitante?.nombre_usuario || 'Un usuario'} te ha enviado una solicitud de intercambio por "${libro.titulo}"`,
      leida: false,
    });

    await this.notificacionRepository.save(notificacion);

    // Retornar respuesta formateada
    const intercambioCompleto = await this.intercambioRepository.findOne({
      where: { id_intercambio: savedIntercambio.id_intercambio },
      relations: ['libro_solicitado', 'libro_ofertado', 'usuario_solicitante', 'usuario_solicitante_receptor'],
    });

    if (!intercambioCompleto) {
      throw new Error('No se pudo recuperar el intercambio creado');
    }

    return this.formatExchangeResponse(intercambioCompleto);
  }

  /**
   * Obtener un intercambio específico por ID
   */
  async getExchangeById(intercambioId: number): Promise<ExchangeResponseDto & { id_chat?: number }> {
    const intercambio = await this.intercambioRepository.findOne({
      where: { id_intercambio: intercambioId },
      relations: ['libro_solicitado', 'libro_ofertado', 'usuario_solicitante', 'usuario_solicitante_receptor'],
    });

    if (!intercambio) {
      throw new NotFoundException('Intercambio no encontrado');
    }

    const response = this.formatExchangeResponse(intercambio);

    // Si el intercambio fue aceptado, buscar el chat asociado
    if (intercambio.estado_propuesta === EstadoPropuesta.ACCEPTED) {
      try {
        const chats = await this.chatService.getUserChats(intercambio.id_usuario_solicitante_fk);
        const chat = chats.find(c => 
          c.otherUserId === intercambio.id_usuario_solicitante_receptor_fk
        );
        
        if (chat) {
          return { ...response, id_chat: chat.id_chat };
        }
      } catch (error) {
        console.error('Error buscando chat:', error);
      }
    }

    return response;
  }

  /**
   * Obtener intercambios recibidos por un usuario (notificaciones de intercambio)
   */
  async getReceivedExchanges(userId: number): Promise<ExchangeResponseDto[]> {
    const intercambios = await this.intercambioRepository.find({
      where: { id_usuario_solicitante_receptor_fk: userId },
      relations: ['libro_solicitado', 'libro_ofertado', 'usuario_solicitante', 'usuario_solicitante_receptor'],
      order: { fecha_propuesta: 'DESC' },
    });

    return intercambios.map(i => this.formatExchangeResponse(i));
  }

  /**
   * Obtener intercambios enviados por un usuario
   */
  async getSentExchanges(userId: number): Promise<ExchangeResponseDto[]> {
    const intercambios = await this.intercambioRepository.find({
      where: { id_usuario_solicitante_fk: userId },
      relations: ['libro_solicitado', 'libro_ofertado', 'usuario_solicitante', 'usuario_solicitante_receptor'],
      order: { fecha_propuesta: 'DESC' },
    });

    return intercambios.map(i => this.formatExchangeResponse(i));
  }

  /**
   * Aceptar o rechazar intercambio
   */
  async updateExchangeStatus(
    intercambioId: number,
    userId: number,
    dto: UpdateExchangeDto,
  ): Promise<ExchangeResponseDto & { id_chat?: number }> {
    const intercambio = await this.intercambioRepository.findOne({
      where: { id_intercambio: intercambioId },
      relations: ['libro_solicitado', 'usuario_solicitante', 'usuario_solicitante_receptor'],
    });

    if (!intercambio) {
      throw new NotFoundException('Intercambio no encontrado');
    }

    // Verificar que el usuario es el receptor
    if (intercambio.id_usuario_solicitante_receptor_fk !== userId) {
      throw new BadRequestException('No tienes permiso para actualizar este intercambio');
    }

    // Actualizar estado
    intercambio.estado_propuesta = dto.estado_propuesta;
    
    if (dto.estado_propuesta === EstadoPropuesta.ACCEPTED) {
      intercambio.fecha_acuerdo = new Date();
      if (dto.id_punto_encuentro) {
        intercambio.id_punto_encuentro_fk = dto.id_punto_encuentro;
      }
    }

    const updated = await this.intercambioRepository.save(intercambio);

    // Crear notificación para el solicitante
    const tipoNotif = dto.estado_propuesta === EstadoPropuesta.ACCEPTED
      ? TipoNotificacion.INTERCAMBIO_ACEPTADO
      : TipoNotificacion.INTERCAMBIO_RECHAZADO;

    const mensaje = dto.estado_propuesta === EstadoPropuesta.ACCEPTED
      ? `Tu solicitud de intercambio por "${intercambio.libro_solicitado.titulo}" ha sido aceptada`
      : `Tu solicitud de intercambio por "${intercambio.libro_solicitado.titulo}" ha sido rechazada`;

    const notificacion = this.notificacionRepository.create({
      id_usuario_receptor: intercambio.id_usuario_solicitante_fk,
      id_usuario_emisor: userId,
      id_intercambio: intercambioId,
      tipo: tipoNotif,
      mensaje,
      leida: false,
    });

    await this.notificacionRepository.save(notificacion);

    let chatId: number | undefined;

    // Si el intercambio fue aceptado, crear chat automáticamente
    if (dto.estado_propuesta === EstadoPropuesta.ACCEPTED) {
      try {
        const chatResult = await this.chatService.createChat({
          id_usuario1: intercambio.id_usuario_solicitante_fk,
          id_usuario2: intercambio.id_usuario_solicitante_receptor_fk,
          id_intercambio: intercambioId,
        });
        chatId = chatResult.id_chat;
        console.log(`✅ Chat creado automáticamente para intercambio ${intercambioId}: ${chatId}`);
      } catch (error) {
        console.error('Error creando chat automático:', error);
        // No fallar el intercambio si no se pudo crear el chat
      }
    }

    const intercambioActualizado = await this.intercambioRepository.findOne({
      where: { id_intercambio: intercambioId },
      relations: ['libro_solicitado', 'libro_ofertado', 'usuario_solicitante', 'usuario_solicitante_receptor'],
    });

    if (!intercambioActualizado) {
      throw new Error('No se pudo recuperar el intercambio actualizado');
    }

    const response = this.formatExchangeResponse(intercambioActualizado);
    
    // Agregar id_chat a la respuesta si se creó
    return chatId ? { ...response, id_chat: chatId } : response;
  }

  /**
   * Seleccionar libro para ofrecer en intercambio
   */
  async offerBook(intercambioId: number, idLibroOfertado: number): Promise<ExchangeResponseDto> {
    console.log(`[offerBook] Recibiendo solicitud para intercambio ${intercambioId}, libro ${idLibroOfertado}`);
    
    // Obtener el intercambio
    const intercambio = await this.intercambioRepository.findOne({
      where: { id_intercambio: intercambioId },
      relations: ['libro_solicitado', 'usuario_solicitante', 'usuario_solicitante_receptor'],
    });

    if (!intercambio) {
      console.log(`[offerBook] Intercambio ${intercambioId} no encontrado`);
      throw new NotFoundException('Intercambio no encontrado');
    }

    console.log(`[offerBook] Estado del intercambio: ${intercambio.estado_propuesta}`);
    console.log(`[offerBook] Libro ofertado actual: ${intercambio.id_libro_ofertado_fk}`);

    // Verificar que el intercambio esté pendiente o aceptado y sin libro ofertado
    if (intercambio.estado_propuesta !== EstadoPropuesta.PENDING && 
        intercambio.estado_propuesta !== EstadoPropuesta.ACCEPTED) {
      console.log(`[offerBook] ERROR: Intercambio no está en estado pending o accepted`);
      throw new BadRequestException('Solo se puede ofrecer un libro en intercambios pendientes o aceptados');
    }

    // Verificar que no haya un libro ya ofertado
    if (intercambio.id_libro_ofertado_fk) {
      console.log(`[offerBook] ERROR: Ya hay un libro ofertado`);
      throw new BadRequestException('Ya se ha seleccionado un libro para este intercambio');
    }

    // Verificar que el libro existe y pertenece al solicitante
    const libro = await this.libroRepository.findOne({
      where: { id_libro: idLibroOfertado },
      relations: ['propietario'],
    });

    if (!libro) {
      throw new NotFoundException('Libro no encontrado');
    }

    // El receptor selecciona un libro del solicitante para el intercambio
    if (libro.propietario.id_usuario !== intercambio.id_usuario_solicitante_fk) {
      throw new BadRequestException('Solo puedes seleccionar libros del solicitante');
    }

    // Actualizar el intercambio
    intercambio.id_libro_ofertado_fk = idLibroOfertado;
    await this.intercambioRepository.save(intercambio);

    // Crear notificación para el solicitante
    const notificacion = this.notificacionRepository.create({
      id_usuario_receptor: intercambio.id_usuario_solicitante_fk,
      id_usuario_emisor: intercambio.id_usuario_solicitante_receptor_fk,
      id_intercambio: intercambioId,
      tipo: TipoNotificacion.SOLICITUD_INTERCAMBIO,
      mensaje: `${intercambio.usuario_solicitante_receptor.nombre_usuario} ha ofrecido el libro "${libro.titulo}" para intercambiar`,
      leida: false,
    });

    await this.notificacionRepository.save(notificacion);

    // Retornar respuesta formateada
    const intercambioCompleto = await this.intercambioRepository.findOne({
      where: { id_intercambio: intercambioId },
      relations: ['libro_solicitado', 'libro_ofertado', 'usuario_solicitante', 'usuario_solicitante_receptor'],
    });

    if (!intercambioCompleto) {
      throw new Error('No se pudo recuperar el intercambio actualizado');
    }

    return this.formatExchangeResponse(intercambioCompleto);
  }

  /**
   * Proponer ubicación de encuentro
   */
  async proposeMeetingLocation(
    intercambioId: number,
    lat: number,
    lng: number,
    nombre: string,
    direccion: string,
    placeId?: string,
  ): Promise<any> {
    const intercambio = await this.intercambioRepository.findOne({
      where: { id_intercambio: intercambioId },
      relations: ['usuario_solicitante', 'usuario_solicitante_receptor'],
    });

    if (!intercambio) {
      throw new NotFoundException('Intercambio no encontrado');
    }

    // Solo si el intercambio está aceptado y ambos libros están seleccionados
    if (intercambio.estado_propuesta !== EstadoPropuesta.ACCEPTED) {
      throw new BadRequestException('El intercambio debe estar aceptado para proponer ubicación');
    }

    if (!intercambio.id_libro_ofertado_fk) {
      throw new BadRequestException('Ambos libros deben estar seleccionados antes de proponer ubicación');
    }

    // Actualizar ubicación
    intercambio.ubicacion_encuentro_lat = lat;
    intercambio.ubicacion_encuentro_lng = lng;
    intercambio.ubicacion_encuentro_nombre = nombre;
    intercambio.ubicacion_encuentro_direccion = direccion;
    intercambio.ubicacion_encuentro_place_id = placeId || null;

    await this.intercambioRepository.save(intercambio);

    // Notificar al otro usuario
    // Determinar quién propuso la ubicación y notificar al otro
    return {
      success: true,
      data: {
        id_intercambio: intercambio.id_intercambio,
        ubicacion_encuentro: {
          lat,
          lng,
          nombre,
          direccion,
          place_id: placeId || null,
        },
      },
    };
  }

  /**
   * Confirmar intercambio (bilateral)
   */
  async confirmExchange(intercambioId: number, usuarioId: number): Promise<any> {
    const intercambio = await this.intercambioRepository.findOne({
      where: { id_intercambio: intercambioId },
      relations: ['usuario_solicitante', 'usuario_solicitante_receptor', 'libro_solicitado', 'libro_ofertado'],
    });

    if (!intercambio) {
      throw new NotFoundException('Intercambio no encontrado');
    }

    // Verificar que el usuario es parte del intercambio
    const esSolicitante = intercambio.id_usuario_solicitante_fk === usuarioId;
    const esReceptor = intercambio.id_usuario_solicitante_receptor_fk === usuarioId;

    if (!esSolicitante && !esReceptor) {
      throw new BadRequestException('No eres parte de este intercambio');
    }

    // Verificar que haya ubicación propuesta
    if (!intercambio.ubicacion_encuentro_lat || !intercambio.ubicacion_encuentro_lng) {
      throw new BadRequestException('Debe haber una ubicación de encuentro antes de confirmar');
    }

    // Actualizar confirmación correspondiente
    if (esSolicitante) {
      if (intercambio.confirmacion_solicitante) {
        throw new BadRequestException('Ya has confirmado este intercambio');
      }
      intercambio.confirmacion_solicitante = true;
    } else {
      if (intercambio.confirmacion_receptor) {
        throw new BadRequestException('Ya has confirmado este intercambio');
      }
      intercambio.confirmacion_receptor = true;
    }

    // Si ambos confirman, cambiar estado a COMPLETED
    const ambosConfirmaron = intercambio.confirmacion_solicitante && intercambio.confirmacion_receptor;
    if (ambosConfirmaron) {
      intercambio.estado_propuesta = EstadoPropuesta.COMPLETED;
      intercambio.fecha_acuerdo = new Date();

      // Cambiar estado de ambos libros a "exchanged"
      if (intercambio.libro_solicitado) {
        intercambio.libro_solicitado.estado = EstadoLibro.EXCHANGED;
        await this.libroRepository.save(intercambio.libro_solicitado);
      }
      if (intercambio.libro_ofertado) {
        intercambio.libro_ofertado.estado = EstadoLibro.EXCHANGED;
        await this.libroRepository.save(intercambio.libro_ofertado);
      }
    }

    await this.intercambioRepository.save(intercambio);

    // Crear notificación para el otro usuario
    const otroUsuarioId = esSolicitante 
      ? intercambio.id_usuario_solicitante_receptor_fk 
      : intercambio.id_usuario_solicitante_fk;
    
    const usuarioActual = esSolicitante 
      ? intercambio.usuario_solicitante 
      : intercambio.usuario_solicitante_receptor;

    const mensaje = ambosConfirmaron
      ? `¡Intercambio completado! Encuentren en ${intercambio.ubicacion_encuentro_nombre}`
      : `${usuarioActual.nombre_usuario} ha confirmado el intercambio. Esperando tu confirmación`;

    const notificacion = this.notificacionRepository.create({
      id_usuario_receptor: otroUsuarioId,
      id_usuario_emisor: usuarioId,
      id_intercambio: intercambioId,
      tipo: ambosConfirmaron ? TipoNotificacion.INTERCAMBIO_COMPLETADO : TipoNotificacion.SOLICITUD_INTERCAMBIO,
      mensaje,
    });

    await this.notificacionRepository.save(notificacion);

    return {
      success: true,
      data: {
        id_intercambio: intercambio.id_intercambio,
        confirmacion_solicitante: intercambio.confirmacion_solicitante,
        confirmacion_receptor: intercambio.confirmacion_receptor,
        ambos_confirmaron: ambosConfirmaron,
        estado_propuesta: intercambio.estado_propuesta,
      },
    };
  }

  /**
   * Formatear respuesta de intercambio
   */
  private formatExchangeResponse(intercambio: Intercambio): ExchangeResponseDto {
    return {
      id_intercambio: intercambio.id_intercambio,
      libro_solicitado: {
        id_libro: intercambio.libro_solicitado.id_libro,
        titulo: intercambio.libro_solicitado.titulo,
      },
      libro_ofertado: intercambio.libro_ofertado ? {
        id_libro: intercambio.libro_ofertado.id_libro,
        titulo: intercambio.libro_ofertado.titulo,
      } : null,
      usuario_solicitante: {
        id_usuario: intercambio.usuario_solicitante.id_usuario,
        nombre_usuario: intercambio.usuario_solicitante.nombre_usuario,
      },
      usuario_receptor: {
        id_usuario: intercambio.usuario_solicitante_receptor.id_usuario,
        nombre_usuario: intercambio.usuario_solicitante_receptor.nombre_usuario,
      },
      estado_propuesta: intercambio.estado_propuesta,
      fecha_propuesta: intercambio.fecha_propuesta.toISOString(),
      fecha_acuerdo: intercambio.fecha_acuerdo?.toISOString() || null,
    };
  }
}
