import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';
import {
  Catch,
  ExceptionFilter,
  NotFoundException,
  ArgumentsHost,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch(NotFoundException)
class NotFoundFilter implements ExceptionFilter {
  catch(_: NotFoundException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    res.status(404).sendFile(join(process.cwd(), 'public', 'html', '404.html'));
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ✅ CORS inschakelen met toegestane origins en exposed headers
  app.enableCors({
    origin: [
      'http://localhost:3000', // jouw lokale frontend
      'https://workshoptest.wailsalutem-foundation.com', // productie frontend
    ],
    credentials: true,
    exposedHeaders: ['Authorization'], // ✅ hierdoor kan je frontend de JWT header lezen
  });

  // Statische bestanden uit de public-map serveren
  app.useStaticAssets(join(process.cwd(), 'public'));

  // Logging van requests (handig voor debugging)
  app.use((req, _res, next) => {
    console.log('Requested URL:', req.url);
    next();
  });
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));


  // Eerst alle modules/controllers initialiseren
  await app.init();

  // Globale 404-afhandeling
  app.useGlobalFilters(new NotFoundFilter());

  // Start de app
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`✅ Server running on port ${port}`);
}

bootstrap();
