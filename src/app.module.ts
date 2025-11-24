import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { WorkshopModule } from './workshop/presentation/module/workshop.module';
import { SecurityModule } from './security/security.module';
import { PageController } from './security/presentation/controller/page.controller';
import { RegistrationModule } from './security/presentation/controller/registration.module';
import { UserModule } from './security/presentation/controller/user.module';
import { MailModule } from './mail/mail.modules';
import { ReviewModule } from './workshop/presentation/module/review.module';

@Module({
  imports: [
    // ✅ .env laden
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ✅ Database (MySQL) connectie
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
        logging: true,
        logger: 'advanced-console',
      }),
    }),

    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'workshop-uploads'),
      serveRoot: '/uploads',
    }),
    WorkshopModule,
    SecurityModule,
    RegistrationModule,
    UserModule,
    MailModule,
    ReviewModule,
  ],
  controllers: [PageController],
})
export class AppModule {}
