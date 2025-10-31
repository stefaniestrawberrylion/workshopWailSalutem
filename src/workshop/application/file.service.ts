import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoredFile } from '../domain/stored-file.entity';

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(StoredFile)
    private readonly repo: Repository<StoredFile>,
  ) {}

  async getFileById(id: string) {
    return this.repo.findOne({ where: { id } });
  }
}
