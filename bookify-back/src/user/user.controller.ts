import { Body, Controller, Get, Param, ParseIntPipe, Patch, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; 

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard) // Protegemos la ruta
  @Patch('push-token')
  async updatePushToken(@Request() req, @Body() body: { token: string }) {
    const userId = req.user.userId || req.user.id_usuario || req.user.sub; 
    
    return this.userService.updatePushToken(userId, body.token);
  }

  @Get(':id')
  async getUserProfile(@Param('id', ParseIntPipe) id: number) {
    try {
      const user = await this.userService.getUserProfile(id);
      return {
        success: true,
        data: user,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error al obtener perfil de usuario',
      };
    }
  }
}