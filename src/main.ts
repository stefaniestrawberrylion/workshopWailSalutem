import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { Catch, ExceptionFilter, NotFoundException, ArgumentsHost } from '@nestjs/common';
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

  // Statische bestanden uit public/
  app.useStaticAssets(join(process.cwd(), 'public'));

  // Logging van requests
  app.use((req, _res, next) => {
    console.log('Requested URL:', req.url);
    next();
  });

  // Init eerst alle modules/controllers
  await app.init();

  // Globale 404-handler
  app.useGlobalFilters(new NotFoundFilter());

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
