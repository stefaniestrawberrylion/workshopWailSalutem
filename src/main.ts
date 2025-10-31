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

// 🔹 Custom 404-pagina
@Catch(NotFoundException)
class NotFoundFilter implements ExceptionFilter {
  catch(_: NotFoundException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    res.status(404).sendFile(join(process.cwd(), 'public', 'html', '404.html'));
  }
}

async function bootstrap() {
  // ✅ Maak app aan mét CORS correct geconfigureerd
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      origin: [
        'http://localhost:3000',
        'https://workshoptest.wailsalutem-foundation.com',
      ],
      credentials: true,
      exposedHeaders: ['Authorization'], // laat frontend Authorization header zien
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Authorization', 'Content-Type'],
    },
  });

  // ✅ Statische assets (voor HTML/CSS/JS)
  app.useStaticAssets(join(process.cwd(), 'public'));

  // ✅ Logging (optioneel, handig voor debuggen)
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // ✅ Uploads publiek beschikbaar maken
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  // ✅ Globale 404-afhandeling
  app.useGlobalFilters(new NotFoundFilter());

  // ✅ Start de applicatie
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Server running on port ${port}`);
}

bootstrap();
