import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Statische bestanden
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // Root route naar index.html
  const server = app.getHttpAdapter().getInstance(); // dit is de echte Express instance
  server.get('*', (req, res) => {
    res.sendFile(join(__dirname, '..', 'public', 'index.html'));
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
