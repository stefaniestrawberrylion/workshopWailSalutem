import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from '../controller/user.controller';
import { User } from '../../domain/user.entity';
import { Admin } from '../../domain/admin.entity';
import { UserService } from '../../application/user.service';
import { PasswordService } from '../../application/password.service';
import { TokenService } from '../../application/token.service';
import { SecurityModule } from './security.module';
import { MailModule } from '../../../mail/mail.modules';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Admin]),
    SecurityModule,
    MailModule,
  ],
  controllers: [UserController],
  providers: [UserService, PasswordService, TokenService],
  exports: [UserService, PasswordService, TokenService],
})
export class UserModule {}
