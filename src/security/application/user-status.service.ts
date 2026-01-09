import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../domain/user.entity';
import { Role } from '../domain/enums/role.enum';
import { Status } from '../domain/enums/state.enum';

import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { MailService } from '../../mail/application/mail.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
  ) {}

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: Role,
  ): Promise<void> {
    await this.ensureEmailUnique(email);

    const user = this.userRepository.create({
      email,
      password: await this.passwordService.hash(password),
      firstName,
      lastName,
      role,
      status: Status.APPROVED,
    });

    await this.userRepository.save(user);
  }

  async registerRequest(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    school: string,
    phone: string,
  ): Promise<void> {
    await this.ensureEmailUnique(email);

    const user = this.userRepository.create({
      email,
      password: await this.passwordService.hash(password),
      firstName,
      lastName,
      school,
      phone,
      role: Role.USER,
      status: Status.PENDING,
    });

    await this.userRepository.save(user);

    await this.mailService.sendAdminNotification(
      email,
      `${firstName} ${lastName}`,
    );
  }

  async login(user: User): Promise<{ access_token: string }> {
    return {
      access_token: await this.tokenService.createAccessToken(user),
    };
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) return;

    const code = this.passwordService.generateResetCode();

    user.passwordResetCode = await this.passwordService.hash(code);
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);

    await this.userRepository.save(user);

    await this.mailService.sendPasswordResetCode(
      user.email,
      user.firstName,
      code,
    );
  }

  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user?.passwordResetCode || !user.passwordResetExpires) {
      throw new BadRequestException('Ongeldige resetgegevens');
    }

    if (user.passwordResetExpires < new Date()) {
      throw new BadRequestException('Resetcode is verlopen');
    }

    const valid = await this.passwordService.compare(
      code,
      user.passwordResetCode,
    );

    if (!valid) {
      throw new BadRequestException('Ongeldige resetcode');
    }

    user.password = await this.passwordService.hash(newPassword);
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;

    await this.userRepository.save(user);
  }

  async deleteUser(id: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Gebruiker niet gevonden met id: ${id}`);
    }

    await this.userRepository.delete(id);

    try {
      await this.sendAccountDeletedEmail(user.email);
    } catch {}
  }

  async getPendingUsers(): Promise<User[]> {
    return this.userRepository.find({ where: { status: Status.PENDING } });
  }

  async getUsersByStatus(status: Status): Promise<User[]> {
    return this.userRepository.find({ where: { status } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async getUserById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async updateUserAvatar(userId: number, avatarUrl: string): Promise<User> {
    const user = await this.getUserById(userId);
    if (!user) throw new NotFoundException('Gebruiker niet gevonden');

    user.avatarUrl = avatarUrl;
    return this.userRepository.save(user);
  }

  private async ensureEmailUnique(email: string): Promise<void> {
    const exists = await this.userRepository.findOne({ where: { email } });
    if (exists) {
      throw new BadRequestException(`Email bestaat al: ${email}`);
    }
  }

  private async sendAccountDeletedEmail(email: string): Promise<void> {
    const subject = 'Account Verwijderd';
    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h2 style="color:#d9534f;">Account Verwijderd</h2>
        <p>Het account gekoppeld aan <b>${email}</b> is verwijderd.</p>
        <p>
          Vragen? Mail naar
          <a href="mailto:workshop@wailsalutem-foundation.com">
            workshop@wailsalutem-foundation.com
          </a>
        </p>
      </div>
    `;

    await this.mailService.sendGenericEmail(email, subject, html);
  }
}
