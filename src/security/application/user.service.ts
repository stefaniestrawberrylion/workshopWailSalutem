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

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

  /**
   * Registreert een nieuwe gebruiker met opgegeven rol.
   * Gooit een exception als het e-mailadres al bestaat.
   */
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

  /**
   * Registreert een gebruiker met status PENDING (voor goedkeuring).
   */
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

  /**
   * Update de status van een gebruiker (PENDING, APPROVED, DENIED).
   */
  async updateStatus(userId: number, status: Status): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Gebruiker niet gevonden met id: ${userId}`);
    }

    user.status = status;
    await this.userRepository.save(user);
  }

  /**
   * Haal alle gebruikers met status PENDING op.
   */
  async getPendingUsers(): Promise<User[]> {
    return this.userRepository.find({ where: { status: Status.PENDING } });
  }

  async getUsersByStatus(status: Status): Promise<User[]> {
    return this.userRepository.find({ where: { status } });
  }

  async deleteUser(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }

  /**
   * Vind een gebruiker op e-mailadres. Retourneert null als niet gevonden.
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  /**
   * Wordt gebruikt door authentication strategie (zoals JWT) om user te laden.
   */
  async loadUserByUsername(email: string): Promise<User | Admin> {
    const admin = await this.adminRepository.findOne({ where: { email } });
    if (admin) return admin;

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException(`Gebruiker niet gevonden: ${email}`);
    }

    return user;
  }

  /**
   * Controleer of ingevoerd wachtwoord overeenkomt met gehashte wachtwoord.
   */
  async checkPassword(user: User, rawPassword: string): Promise<boolean> {
    const isMatch: boolean = await bcrypt.compare(rawPassword, user.password);
    return isMatch;
  }
}
