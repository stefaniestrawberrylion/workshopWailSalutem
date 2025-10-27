import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcrypt';
import { Admin } from '../domain/admin.entity';

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

      // ✅ expliciet type en veilige aanroep
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      const encodedPassword: string = (await bcrypt.hash(
        password,
        10,
      )) as string;

      const admin: Admin = this.adminRepository.create({
        email,
        password: encodedPassword,
        firstName,
        lastName,
      });

      await this.adminRepository.save(admin);
    } catch (err: unknown) {
      if (err instanceof BadRequestException) {
        throw err;
      }

      if (err instanceof Error) {
        throw new BadRequestException(err.message);
      }

      throw new BadRequestException(
        'Onbekende fout bij het registreren van admin.',
      );
    }
  }
}
