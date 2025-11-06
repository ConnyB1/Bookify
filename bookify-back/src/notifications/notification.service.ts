import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacion } from '../entities/notification.entity';
import { NotificationDto } from './notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notificacion)
    private notificacionRepository: Repository<Notificacion>,
  ) {}

  /**
   * Obtener notificaciones de un usuario
   */
  async getUserNotifications(userId: number, onlyUnread = false): Promise<NotificationDto[]> {
    const where: any = { id_usuario_receptor: userId };
    
    if (onlyUnread) {
      where.leida = false;
    }

    const notificaciones = await this.notificacionRepository.find({
      where,
      relations: ['usuario_emisor', 'intercambio'],
      order: { fecha_creacion: 'DESC' },
      take: 50, // Limitar a las 50 más recientes
    });

    return notificaciones.map(n => this.formatNotification(n));
  }

  /**
   * Marcar notificación como leída
   */
  async markAsRead(notificationId: number, userId: number): Promise<NotificationDto> {
    const notificacion = await this.notificacionRepository.findOne({
      where: { id_notificacion: notificationId, id_usuario_receptor: userId },
      relations: ['usuario_emisor', 'intercambio'],
    });

    if (!notificacion) {
      throw new Error('Notificación no encontrada');
    }

    notificacion.leida = true;
    const updated = await this.notificacionRepository.save(notificacion);

    return this.formatNotification(updated);
  }

  /**
   * Marcar todas como leídas
   */
  async markAllAsRead(userId: number): Promise<{ count: number }> {
    const result = await this.notificacionRepository.update(
      { id_usuario_receptor: userId, leida: false },
      { leida: true },
    );

    return { count: result.affected || 0 };
  }

  /**
   * Obtener contador de no leídas
   */
  async getUnreadCount(userId: number): Promise<number> {
    return this.notificacionRepository.count({
      where: { id_usuario_receptor: userId, leida: false },
    });
  }

  /**
   * Eliminar una notificación específica
   */
  async deleteNotification(notificationId: number, userId: number): Promise<void> {
    const notificacion = await this.notificacionRepository.findOne({
      where: { id_notificacion: notificationId, id_usuario_receptor: userId },
    });

    if (!notificacion) {
      throw new Error('Notificación no encontrada o no tienes permiso para eliminarla');
    }

    await this.notificacionRepository.remove(notificacion);
    console.log(`🗑️ Notificación ${notificationId} eliminada por usuario ${userId}`);
  }

  /**
   * Formatear notificación
   */
  private formatNotification(notificacion: Notificacion): NotificationDto {
    return {
      id_notificacion: notificacion.id_notificacion,
      tipo: notificacion.tipo,
      mensaje: notificacion.mensaje,
      leida: notificacion.leida,
      fecha_creacion: notificacion.fecha_creacion.toISOString(),
      usuario_emisor: notificacion.usuario_emisor ? {
        id_usuario: notificacion.usuario_emisor.id_usuario,
        nombre_usuario: notificacion.usuario_emisor.nombre_usuario,
        foto_perfil_url: notificacion.usuario_emisor.foto_perfil_url ?? undefined,
      } : null,
      intercambio: notificacion.intercambio ? {
        id_intercambio: notificacion.intercambio.id_intercambio,
        estado_propuesta: notificacion.intercambio.estado_propuesta,
      } : null,
    };
  }
}
