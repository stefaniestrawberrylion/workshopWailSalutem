import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationController } from '../controller/registration.controller';
import { AdminService } from '../../application/admin.service';
import { UserService } from '../../application/user.service';
import { Admin } from '../../domain/admin.entity';
import { User } from '../../domain/user.entity';
import { SecurityModule } from '../../security.module';
import { MailModule } from '../../../mail/mail.modules';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin, User]),
    SecurityModule,
    MailModule,
  ],
  controllers: [RegistrationController],
  providers: [AdminService, UserService],
  exports: [UserService, AdminService],
})
export class RegistrationModule {}
