import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../entities/user.entity';
import { RegisterDto, LoginDto, AuthResponseDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private userRepository: Repository<Usuario>,
  ) {}


  private generateToken(userId: number, username: string): string {
    const payload = {
      id: userId,
      username: username,
      timestamp: Date.now(),
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    try {
      const { nombre_usuario, email, password, genero } = registerDto;

      if (!nombre_usuario || !email || !password) {
        throw new BadRequestException('Todos los campos son obligatorios');
      }

      const existingUser = await this.userRepository.findOne({
        where: [{ email }, { nombre_usuario }],
      });

      if (existingUser) {
        if (existingUser.email === email) {
          throw new BadRequestException('El email ya está registrado');
        }
        if (existingUser.nombre_usuario === nombre_usuario) {
          throw new BadRequestException('El nombre de usuario ya está en uso');
        }
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new BadRequestException('Formato de email inválido');
      }

      if (password.length < 4) {
        throw new BadRequestException('La contraseña debe tener al menos 4 caracteres');
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const newUser = this.userRepository.create({
        nombre_usuario,
        email: email.toLowerCase(),
        password_hash: passwordHash,
        genero: genero || null,
      });

      const savedUser = await this.userRepository.save(newUser);

      const token = this.generateToken(savedUser.id_usuario, savedUser.nombre_usuario);

      return {
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          user: {
            id_usuario: savedUser.id_usuario,
            nombre_usuario: savedUser.nombre_usuario,
            email: savedUser.email,
            genero: savedUser.genero ?? undefined,
            foto_perfil_url: savedUser.foto_perfil_url ?? undefined,
          },
          tokens: {
            accessToken: token,
            refreshToken: token,
            idToken: token,
          },
        },
      };
    } catch (error) {
      console.error('Error en registro:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al registrar usuario');
    }
  }

  /**
   * Login
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    try {
      const { nombre_usuario, password } = loginDto;

      if (!nombre_usuario || !password) {
        throw new UnauthorizedException('Nombre de usuario y contraseña son obligatorios');
      }

      // Buscar usuario por nombre_usuario o email
      const user = await this.userRepository.findOne({
        where: [
          { nombre_usuario },
          { email: nombre_usuario }, // Permitir login con email también
        ],
      });

      if (!user) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      // Verificar contraseña
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      // Generar token
      const token = this.generateToken(user.id_usuario, user.nombre_usuario);

      return {
        success: true,
        message: 'Login exitoso',
        data: {
          user: {
            id_usuario: user.id_usuario,
            nombre_usuario: user.nombre_usuario,
            email: user.email,
            genero: user.genero ?? undefined,
            foto_perfil_url: user.foto_perfil_url ?? undefined,
          },
          tokens: {
            accessToken: token,
            refreshToken: token,
            idToken: token,
          },
        },
      };
    } catch (error) {
      console.error('Error en login:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Error al iniciar sesión');
    }
  }

  /**
   * Obtener información del usuario por ID
   */
  async getUserById(userId: number): Promise<Usuario | null> {
    return this.userRepository.findOne({ where: { id_usuario: userId } });
  }

  /**
   * Verificar token
   */
  async verifyToken(token: string): Promise<any> {
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      return decoded;
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }

  /**
   * Actualizar foto de perfil
   */
  async updateProfilePhoto(userId: number, photoUrl: string): Promise<AuthResponseDto> {
    try {
      const user = await this.userRepository.findOne({ where: { id_usuario: userId } });

      if (!user) {
        throw new BadRequestException('Usuario no encontrado');
      }

      user.foto_perfil_url = photoUrl;
      const updatedUser = await this.userRepository.save(user);

      return {
        success: true,
        message: 'Foto de perfil actualizada',
        data: {
          user: {
            id_usuario: updatedUser.id_usuario,
            nombre_usuario: updatedUser.nombre_usuario,
            email: updatedUser.email,
            genero: updatedUser.genero ?? undefined,
            foto_perfil_url: updatedUser.foto_perfil_url ?? undefined,
          },
        },
      };
    } catch (error) {
      console.error('Error actualizando foto:', error);
      throw new BadRequestException('Error al actualizar foto de perfil');
    }
  }
}
