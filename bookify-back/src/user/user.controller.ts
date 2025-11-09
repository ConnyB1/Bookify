import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

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
