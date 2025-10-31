import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationController } from './registration.controller';
import { AdminService } from '../../application/admin.service';
import { UserService } from '../../application/user.service';
import { Admin } from '../../domain/admin.entity';
import { User } from '../../domain/user.entity';
import { SecurityModule } from '../../security.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin, User]),
    SecurityModule,
  ],
  controllers: [RegistrationController],
  providers: [AdminService, UserService],
  exports: [UserService, AdminService],
})
export class RegistrationModule {}
