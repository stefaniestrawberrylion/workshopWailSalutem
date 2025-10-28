import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkshopModule } from './workshop/workshop.module';
import { SecurityModule } from './security/security.module';
import { PageController } from './security/presentation/controller/page.controller';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql', // of 'postgres', afhankelijk van je DB
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mydb',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false, // ⚠️ enkel voor dev, niet voor productie
    }),
    WorkshopModule,
    SecurityModule,
  ],
  controllers: [PageController],
  providers: [],
})
export class AppModule {}
