import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../domain/user.entity';
import { Admin } from '../domain/admin.entity';
import { Role } from '../domain/enums/role.enum';
import { Status } from '../domain/enums/state.enum';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../../mail/application/mail.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Repository<Admin>>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: Role,
  ): Promise<void> {
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      throw new BadRequestException(`Email bestaat al: ${email}`);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
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
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      throw new BadRequestException(`Email bestaat al: ${email}`);
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
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

  async updateStatus(userId: number, status: Status): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Gebruiker niet gevonden met id: ${userId}`);
    }

    if (status === Status.DENIED) {
      const userEmail = user.email; // Sla e-mail op voordat u de gebruiker verwijdert
      await this.userRepository.delete(userId);

      try {
        await this.mailService.sendUserStatus(userEmail, 'afgewezen');
      } catch {
        // Fout bij verzenden e-mail wordt niet gelogd
      }

      return;
    }

    user.status = status;
    await this.userRepository.save(user);

    if (status === Status.APPROVED) {
      try {
        await this.mailService.sendUserStatus(user.email, 'goedgekeurd');
      } catch {
        // Fout bij verzenden e-mail wordt niet gelogd
      }
    }
  }

  async getPendingUsers(): Promise<User[]> {
    return this.userRepository.find({ where: { status: Status.PENDING } });
  }

  async getUsersByStatus(status: Status): Promise<User[]> {
    return this.userRepository.find({ where: { status } });
  }

  /**
   * Verwijdert een gebruiker op basis van ID en stuurt een e-mailnotificatie.
   */
  async deleteUser(id: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Gebruiker niet gevonden met id: ${id}`);
    }

    const result = await this.userRepository.delete(id);

    if (result.affected && result.affected > 0) {
      try {
        await this.sendAccountDeletedEmail(user.email);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        // Fout bij verzenden e-mail wordt niet gelogd, maar de delete is wel gelukt
      }
    } else {
      throw new NotFoundException(`Gebruiker niet gevonden met id: ${id}`);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async checkPassword(user: User, rawPassword: string): Promise<boolean> {
    return bcrypt.compare(rawPassword, user.password);
  }

  async login(user: User): Promise<{ access_token: string }> {
    const payload: Record<string, any> = {
      sub: user.id,
      email: user.email,
      roles: [user.role],
      iss: 'wailsalutem-workshops',
      aud: 'wailsalutem',
    };

    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET') as string,
      expiresIn: (this.configService.get<string>('JWT_EXPIRATION') ??
        '1h') as any,
    });

    return { access_token: token };
  }

  /**
   * Verwijdert een gebruiker op basis van e-mail en stuurt een e-mailnotificatie.
   */
  async deleteUserByEmail(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    const result = await this.userRepository.delete({ email });

    if (result.affected === 0) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    try {
      await this.sendAccountDeletedEmail(email);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      // Fout bij verzenden e-mail wordt niet gelogd
    }
  }

  async getUserById(id: number) {
    return this.userRepository.findOne({ where: { id } });
  }

  async updateUserAvatar(userId: number, avatarUrl: string): Promise<User> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error('Gebruiker niet gevonden');

    user.avatarUrl = avatarUrl;
    return this.userRepository.save(user);
  }

  /**
   * Interne methode om de 'account verwijderd' e-mail te sturen.
   */
  private async sendAccountDeletedEmail(email: string): Promise<void> {
    const subject = 'Account Verwijderd';
    const html = `
      <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
        <h2 style="color: #d9534f;">Account Verwijderd</h2>
        <p>Dit is een bevestiging dat het account gekoppeld aan <b>${email}</b> is verwijderd.</p>
        <p>Mocht je vragen hebben over deze actie, neem dan contact op via <a href="mailto:workshop@wailsalutem-foundation.com">workshop@wailsalutem-foundation.com</a>.</p>
        <p style="margin-top: 20px;">Met vriendelijke groet,<br>Het Wailsalutem Foundation Team</p>
      </div>
    `;

    // Gebruik van de nieuwe, algemene methode in MailService
    await this.mailService.sendGenericEmail(email, subject, html);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) return; // BELANGRIJK: geen fout gooien

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = await bcrypt.hash(code, 10);

    user.passwordResetCode = hashedCode;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);

    await this.userRepository.save(user);

    await this.mailService.sendPasswordResetCode(
      user.email,
      `${user.firstName}`,
      code,
    );
  }
  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user || !user.passwordResetCode || !user.passwordResetExpires) {
      throw new BadRequestException('Ongeldige resetgegevens');
    }

    if (user.passwordResetExpires < new Date()) {
      throw new BadRequestException('Resetcode is verlopen');
    }

    const codeOk = await bcrypt.compare(code, user.passwordResetCode);
    if (!codeOk) {
      throw new BadRequestException('Ongeldige resetcode');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;

    await this.userRepository.save(user);
  }
}
