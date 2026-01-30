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
      'http://10.41.72.78:19006', // Expo web con IP de la red actual
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
  // Escuchar en todas las interfaces para que dispositivos en la LAN puedan alcanzar el backend
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Backend running on:`);
  console.log(`   - Local:   http://127.0.0.1:${port}`);
  console.log(`   - Network: http://0.0.0.0:${port} (accessible from LAN)`);
  console.log(`📁 Image upload endpoint: http://0.0.0.0:${port}/api/images/upload/book`);
  console.log(`\n⚠️  Configure EXPO_PUBLIC_API_URL in your .env to: http://[YOUR_LOCAL_IP]:${port}`);
}
bootstrap();
