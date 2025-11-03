import { Controller, Post, Body, Get, Headers, UnauthorizedException, Param, Put, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  async getProfile(@Headers('authorization') authorization: string) {
    if (!authorization) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    const token = authorization.replace('Bearer ', '');
    const decoded = await this.authService.verifyToken(token);
    const user = await this.authService.getUserById(decoded.id);

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return {
      success: true,
      data: {
        user: {
          id_usuario: user.id_usuario,
          nombre_usuario: user.nombre_usuario,
          email: user.email,
          genero: user.genero,
          foto_perfil_url: user.foto_perfil_url,
        },
      },
    };
  }

  @Put('profile-photo/:userId')
  async updateProfilePhoto(
    @Param('userId') userId: string,
    @Body() body: { photoUrl: string },
  ) {
    return this.authService.updateProfilePhoto(+userId, body.photoUrl);
  }
}
