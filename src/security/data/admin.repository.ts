import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from '../domain/admin.entity';

@Injectable()
export class AdminRepository {
  constructor(
    @InjectRepository(Admin)
    private readonly repository: Repository<Admin>,
  ) {}

  async findByEmail(email: string): Promise<Admin | null> {
    return this.repository.findOne({ where: { email } });
  }

  async save(admin: Admin): Promise<Admin> {
    return this.repository.save(admin);
  }

  async findAll(): Promise<Admin[]> {
    return this.repository.find();
  }

  async findById(id: number): Promise<Admin | null> {
    return this.repository.findOne({ where: { id } });
  }

  async deleteById(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
