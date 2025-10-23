import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Libro } from './book.entity';
import { Usuario } from './user.entity';
import { PuntoEncuentro } from './location.entity';

export enum EstadoPropuesta {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELED = 'canceled',
  COMPLETED = 'completed',
}

@Entity('intercambio')
export class Intercambio {
  @PrimaryGeneratedColumn({ name: 'id_intercambio' })
  id_intercambio: number;

  @Column({ name: 'id_libro_solicitado' })
  id_libro_solicitado_fk: number;

  @ManyToOne(() => Libro)
  @JoinColumn({ name: 'id_libro_solicitado' })
  libro_solicitado: Libro;

  @Column({ name: 'id_libro_ofertado', nullable: true })
  id_libro_ofertado_fk: number | null;

  @ManyToOne(() => Libro, { nullable: true })
  @JoinColumn({ name: 'id_libro_ofertado' })
  libro_ofertado: Libro;

  @Column({ name: 'id_usuario_solicitante' })
  id_usuario_solicitante_fk: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.intercambios_solicitados)
  @JoinColumn({ name: 'id_usuario_solicitante' })
  usuario_solicitante: Usuario;

  @Column({ name: 'id_usuario_solicitante_receptor' })
  id_usuario_solicitante_receptor_fk: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.intercambios_recibidos)
  @JoinColumn({ name: 'id_usuario_solicitante_receptor' })
  usuario_solicitante_receptor: Usuario;

  @Column({ name: 'id_punto_encuentro', nullable: true })
  id_punto_encuentro_fk: number | null;

  @ManyToOne(() => PuntoEncuentro, { nullable: true })
  @JoinColumn({ name: 'id_punto_encuentro' })
  punto_encuentro: PuntoEncuentro;

  @Column({
    type: 'enum',
    enum: EstadoPropuesta,
    name: 'estado_propuesta',
    default: EstadoPropuesta.PENDING,
  })
  estado_propuesta: EstadoPropuesta;

  @Column({ type: 'timestamptz', name: 'fecha_propuesta', default: () => 'NOW()' })
  fecha_propuesta: Date;

  @Column({ type: 'timestamptz', name: 'fecha_acuerdo', nullable: true })
  fecha_acuerdo: Date;
}

