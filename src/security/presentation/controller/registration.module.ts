import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationController } from './registration.controller';
import { AdminService } from '../../application/admin.service';
import { UserService } from '../../application/user.service';
import { Admin } from '../../domain/admin.entity';
import { User } from '../../domain/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Admin, User])],
  controllers: [RegistrationController],
  providers: [AdminService, UserService],
})
export class RegistrationModule {}
