import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationController } from '../controller/registration.controller';
import { UserService } from '../../application/user.service';
import { AdminService } from '../../application/admin.service';
import { PasswordService } from '../../application/password.service';
import { TokenService } from '../../application/token.service';
import { User } from '../../domain/user.entity';
import { Admin } from '../../domain/admin.entity';
import { SecurityModule } from './security.module';
import { MailModule } from '../../../mail/mail.modules';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Admin]),
    SecurityModule,
    MailModule,
  ],
  controllers: [RegistrationController],
  providers: [UserService, AdminService, PasswordService, TokenService],
  exports: [UserService, AdminService, PasswordService, TokenService],
})
export class RegistrationModule {}
