// src/presentation/controller/user.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { User } from '../../domain/user.entity';
import { Admin } from '../../domain/admin.entity';
import { UserService } from '../../application/user.service';
import { SecurityModule } from '../../security.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Admin]),
    SecurityModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
