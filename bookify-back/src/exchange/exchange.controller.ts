import { Controller, Get, Post, Patch, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { ExchangeService } from './exchange.service';
import { CreateExchangeDto, UpdateExchangeDto, ExchangeResponseDto } from './exchange.dto';

@Controller('api/exchange')
export class ExchangeController {
  constructor(private readonly exchangeService: ExchangeService) {}

  /**
   * Crear solicitud de intercambio
   * POST /api/exchange/request
   */
  @Post('request')
  async createRequest(@Body() dto: CreateExchangeDto): Promise<{
    success: boolean;
    data: ExchangeResponseDto;
    message: string;
  }> {
    try {
      const exchange = await this.exchangeService.createExchangeRequest(dto);
      return {
        success: true,
        data: exchange,
        message: 'Solicitud de intercambio enviada correctamente',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Obtener intercambios recibidos
   * GET /api/exchange/received?userId=123
   */
  @Get('received')
  async getReceived(@Query('userId') userId: string): Promise<{
    success: boolean;
    data: ExchangeResponseDto[];
  }> {
    const exchanges = await this.exchangeService.getReceivedExchanges(Number(userId));
    return {
      success: true,
      data: exchanges,
    };
  }

  /**
   * Obtener intercambios enviados
   * GET /api/exchange/sent?userId=123
   */
  @Get('sent')
  async getSent(@Query('userId') userId: string): Promise<{
    success: boolean;
    data: ExchangeResponseDto[];
  }> {
    const exchanges = await this.exchangeService.getSentExchanges(Number(userId));
    return {
      success: true,
      data: exchanges,
    };
  }

  /**
   * Obtener un intercambio específico por ID
   * GET /api/exchange/:id
   */
  @Get(':id')
  async getById(@Param('id') id: string): Promise<{
    success: boolean;
    data: ExchangeResponseDto & { id_chat?: number };
  }> {
    try {
      const exchange = await this.exchangeService.getExchangeById(Number(id));
      return {
        success: true,
        data: exchange,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Aceptar o rechazar intercambio
   * PATCH /api/exchange/:id?userId=123
   */
  @Patch(':id')
  async updateStatus(
    @Param('id') id: string,
    @Query('userId') userId: string,
    @Body() dto: UpdateExchangeDto,
  ): Promise<{
    success: boolean;
    data: ExchangeResponseDto;
    message: string;
  }> {
    try {
      const exchange = await this.exchangeService.updateExchangeStatus(
        Number(id),
        Number(userId),
        dto,
      );
      return {
        success: true,
        data: exchange,
        message: `Intercambio ${dto.estado_propuesta === 'accepted' ? 'aceptado' : 'rechazado'} correctamente`,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
