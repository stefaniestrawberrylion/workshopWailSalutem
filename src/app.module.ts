import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { WorkshopModule } from './workshop/workshop.module';
import { SecurityModule } from './security/security.module';
import { PageController } from './security/presentation/controller/page.controller';
import { RegistrationModule } from './security/presentation/controller/registration.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Anne1309#SQL!',
      database: process.env.DB_NAME || 'workshops',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
    }),
    WorkshopModule,
    SecurityModule,
    RegistrationModule,
  ],
  controllers: [PageController],
  providers: [],
})
export class AppModule {}
