import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkshopModule } from './workshop/workshop.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'Anne1309#SQL!', // pas aan naar jouw DB
      database: 'workshops',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // let op: niet in productie gebruiken
    }),
    WorkshopModule,
    UserModule,
  ],
})
export class AppModule {}
