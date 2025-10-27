import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Habilitar CORS para el frontend
  app.enableCors({
    origin: [
      'http://localhost:19006', // Expo web
      'http://localhost:3001',  // Frontend alternativo
      'http://localhost:8081',  // Metro bundler
      'http://192.168.50.75:19006', // Expo web con IP local
      'exp://192.168.50.75:19000', // Expo Go con IP local
      '*', // Permitir todos los orígenes temporalmente para desarrollo
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  // Configurar tamaño máximo del payload para uploads
  app.use((req, res, next) => {
    if (req.url.includes('/api/images/upload')) {
      req.setTimeout(30000); // 30 segundos timeout para uploads
    }
    next();
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 Backend running on http://localhost:${port}`);
  console.log(`📁 Image upload endpoint: http://localhost:${port}/api/images/upload/book`);
}
bootstrap();
