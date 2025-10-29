import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);


  console.log('DEBUG JWT_SECRET:', config.get('JWT_SECRET'));

  // Serve static assets vanuit public/
  app.useStaticAssets(join(process.cwd(), 'public'));

  // Debug: log alle requests
  app.use((req, res, next) => {
    console.log('Requested URL:', req.url);
    next();
  });

  // SPA fallback — alleen voor frontend routes, niet voor API
  app.use((req, res, next) => {
    const apiPaths = ['/register', '/auth', '/api']; // alle API-routes
    const ignoredPaths = [
      '/inlog',
      '/toevoegen',
      '/dashboard',
      '/dashboarduser',
      '/workshopuser',
      '/profieladmin',
      '/profieluser',
    ];

    const path = req.path.toLowerCase();

    // Laat API en bekende frontend routes door
    if (
      apiPaths.some((p) => path.startsWith(p)) ||
      ignoredPaths.some((p) => path.startsWith(p))
    ) {
      next();
      return;
    }

    // Anders: fallback naar index.html
    res.sendFile(join(process.cwd(), 'public', 'index.html'));
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
