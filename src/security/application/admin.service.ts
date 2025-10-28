import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Admin } from '../domain/admin.entity';
import { Role } from '../domain/enums/role.enum';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

  async registerAdmin(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Promise<void> {
    try {
      const existingAdmin = await this.adminRepository.findOne({
        where: { email },
      });
      if (existingAdmin) {
        throw new BadRequestException(`Admin email bestaat al: ${email}`);
      }

      const hashedPassword: string = await bcrypt.hash(password, 10);

      const admin: Admin = this.adminRepository.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: Role.ADMIN, // altijd admin rol
      });

      await this.adminRepository.save(admin);
    } catch (err: unknown) {
      if (err instanceof BadRequestException) throw err;
      if (err instanceof Error) throw new BadRequestException(err.message);
      throw new BadRequestException(
        'Onbekende fout bij het registreren van admin.',
      );
    }
  }

  async deleteAdminByEmail(email: string): Promise<void> {
    await this.adminRepository.delete({ email });
  }

  async findByEmail(email: string): Promise<Admin | null> {
    return this.adminRepository.findOne({ where: { email } });
  }
}
