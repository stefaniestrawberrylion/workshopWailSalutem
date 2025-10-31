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

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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
  }

  async updateStatus(userId: number, status: Status): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Gebruiker niet gevonden met id: ${userId}`);
    }

    user.status = status;
    await this.userRepository.save(user);
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
    const isMatch: boolean = await bcrypt.compare(rawPassword, user.password);
    return isMatch;
  }

  /**
   * Genereer JWT token voor goedgekeurde gebruiker
   */
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
    // ✅ Vergeet dit niet!
    return { access_token: token };
  }
}
