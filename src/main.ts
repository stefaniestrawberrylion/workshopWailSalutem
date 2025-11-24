import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      origin: ['https://workshoptest.wailsalutem-foundation.com/'],
      credentials: true,
    },
  });

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use(
    '/uploads',
    express.static(
      join(process.env.HOME || '', 'wailSalutem.workshop-uploads'),
    ),
  );

  // ================== Static assets ==================
  app.useStaticAssets(join(__dirname, '..', 'public'));
  expressApp.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  // ================== Body parser ==================
  app.use(bodyParser.json({ limit: '200mb' }));
  app.use(bodyParser.urlencoded({ limit: '200mb', extended: true }));

  // ================== Logging middleware ==================
  expressApp.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // ================== OPTIONS preflight ==================
  expressApp.use((req: Request, res: Response, next: NextFunction) => {
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

  // ================== CSP middleware ==================
  expressApp.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'", // Alles van eigen domein
        "img-src 'self' http://localhost:3000 data:", // Afbeeldingen
        "media-src 'self' http://localhost:3000 data:", // Video/audio inclusief base64
        "object-src 'none'", // Geen object/embed tags
        "script-src 'self' http://localhost:3000 'unsafe-inline'", // JS
        "style-src 'self' http://localhost:3000 'unsafe-inline' https://cdnjs.cloudflare.com", // CSS extern + inline
        'connect-src *',
        "font-src 'self' http://localhost:3000 https://cdnjs.cloudflare.com", // Fonts extern
        "frame-src 'self'", // Iframes
      ].join('; '),
    );
    next();
  });

  // ================== Favicon ==================
  expressApp.get('/favicon.ico', (_req: Request, res: Response) =>
    res.sendStatus(204),
  );

  // ================== HTML route ==================
  expressApp.get('/inlog', (req: Request, res: Response) => {
    const filePath = join(process.cwd(), 'public', 'html', 'inLog.html');
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send('Pagina niet gevonden');
    }
  });

  // ================== Start server ==================
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Server running on port ${port}`);
}

bootstrap();
