import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../domain/user.entity';
import { Status } from '../domain/enums/state.enum';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  async findByStatus(status: Status): Promise<User[]> {
    return this.repository.find({ where: { status } });
  }

  async save(user: User): Promise<User> {
    return this.repository.save(user);
  }

  async findById(id: number): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  async deleteById(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async findAll(): Promise<User[]> {
    return this.repository.find();
  }
}
