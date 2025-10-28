import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import type { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Cache uitschakelen
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate',
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  // Statische bestanden serveren
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // SPA fallback, controller-routes uitsluiten
  const ignoredPaths = [
    '/inLog',
    '/toevoegen',
    '/dashboard',
    '/dashboardUser',
    '/workshopUser',
    '/profielAdmin',
  ];

  app.use((req: Request, res: Response, next: NextFunction): void => {
    if (typeof req.path === 'string' && ignoredPaths.includes(req.path)) {
      next(); // laat controller afhandelen
      return;
    }
    res.sendFile(join(__dirname, '..', 'public', 'index.html'));
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
