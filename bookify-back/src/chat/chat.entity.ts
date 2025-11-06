import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Usuario } from '../entities/user.entity';

@Entity('chat')
export class Chat {
  @PrimaryGeneratedColumn()
  id_chat: number;

  @Column({ type: 'integer', nullable: true })
  id_intercambio: number | null;
}

@Entity('chat_usuario')
export class ChatUsuario {
  @Column({ primary: true })
  id_chat: number;

  @Column({ primary: true })
  id_usuario: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;
}

@Entity('mensaje')
export class Mensaje {
  @PrimaryGeneratedColumn()
  id_mensaje: number;

  @Column()
  id_chat: number;

  @Column()
  id_usuario_emisor: number;

  @Column('text')
  contenido_texto: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario_emisor' })
  emisor: Usuario;
}
