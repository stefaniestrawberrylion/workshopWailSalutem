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
    private readonly adminRepository: Repository<Admin>,
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
      await this.userRepository.delete(userId);

      try {
        await this.mailService.sendUserStatus(user.email, 'afgewezen');
      } catch (err) {
        // Fout bij verzenden e-mail wordt niet gelogd
      }

      return;
    }

    user.status = status;
    await this.userRepository.save(user);

    if (status === Status.APPROVED) {
      try {
        await this.mailService.sendUserStatus(user.email, 'goedgekeurd');
      } catch (err) {
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

  async deleteUser(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async loadUserByUsername(email: string): Promise<User | Admin> {
    const admin = await this.adminRepository.findOne({ where: { email } });
    if (admin) return admin;

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException(`Gebruiker niet gevonden: ${email}`);
    }

    return user;
  }

  async checkPassword(user: User, rawPassword: string): Promise<boolean> {
    return bcrypt.compare(rawPassword, user.password);
  }

  async updateUser(id: number, updateData: Partial<User>) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new Error('Gebruiker niet gevonden');

    Object.assign(user, updateData);
    return this.userRepository.save(user);
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
      expiresIn: (this.configService.get<string>('JWT_EXPIRATION') ?? '1h') as any,
    });

    return { access_token: token };
  }

  async deleteUserByEmail(email: string): Promise<void> {
    const result = await this.userRepository.delete({ email });
    if (result.affected === 0) {
      throw new NotFoundException(`User with email ${email} not found`);
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
}
