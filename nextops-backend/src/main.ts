import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { LoggingInterceptor } from './prisma/logging.interceptor'; 
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.enableCors(); 

  // Роздача статичних файлів (картинки, файли товарів) з папки uploads
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

 
  const prismaService = app.get(PrismaService);
  app.useGlobalInterceptors(new LoggingInterceptor(prismaService));

  await app.listen(3001);
  console.log(' Бекенд Nextops запущено на: http://localhost:3001/api');
}
bootstrap();
