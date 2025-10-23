import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Libro } from './book.entity';
import { Intercambio } from './exchange.entity';

@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn({ name: 'id_usuario' })
  id_usuario: number;

  @Column({ name: 'nombre_usuario', unique: true })
  nombre_usuario: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  password_hash: string;

  @Column({ nullable: true })
  genero: string;

  @Column({ name: 'foto_perfil_url', nullable: true })
  foto_perfil_url: string;

  // ✅ Relación con los libros que posee el usuario
  @OneToMany(() => Libro, (libro) => libro.propietario)
  libros: Libro[];

  // ✅ Relación con los intercambios donde el usuario es el solicitante
  @OneToMany(() => Intercambio, (intercambio) => intercambio.usuario_solicitante)
  intercambios_solicitados: Intercambio[];

  // ✅ Relación con los intercambios donde el usuario es el receptor
  @OneToMany(() => Intercambio, (intercambio) => intercambio.usuario_solicitante_receptor)
  intercambios_recibidos: Intercambio[];
}

