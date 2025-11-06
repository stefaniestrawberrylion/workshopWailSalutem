import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import { createServer } from 'http';

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
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      origin: [
        'http://localhost:3000',
        '[https://workshoptest.wailsalutem-foundation.com](https://workshoptest.wailsalutem-foundation.com)',
      ],
      credentials: true,
      exposedHeaders: ['Authorization'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Authorization', 'Content-Type'],
    },
  });

  app.useStaticAssets(join(process.cwd(), 'public'));

  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.header(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, OPTIONS',
      );
      res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.use(bodyParser.json({ limit: '200mb' }));
  app.use(bodyParser.urlencoded({ limit: '200mb', extended: true }));

  app.useGlobalFilters(new NotFoundFilter());

  // ✅ Node.js HTTP-server gebruiken om timeout in te stellen
  const port = process.env.PORT ?? 3000;
  const server = createServer(app.getHttpAdapter().getInstance());
  server.timeout = 0; // geen timeout
  server.listen(port, () => console.log(`🚀 Server running on port ${port}`));
}

bootstrap();
