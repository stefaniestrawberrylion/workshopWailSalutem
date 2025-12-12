import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Workshop } from '../domain/workshop.entity';

@Injectable()
export class WorkshopRepository {
  private readonly repo: Repository<Workshop>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(Workshop);
  }

  // Alle workshops ophalen
  async findAll(): Promise<Workshop[]> {
    return this.repo.find();
  }
  // Nieuwste workshops ophalen (sorteren op createdAt)
  async findNewest(limit: number): Promise<Workshop[]> {
    return this.repo.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  // Workshop ophalen op basis van ID
  async findById(id: number): Promise<Workshop | null> {
    return this.repo.findOne({ where: { id } });
  }

  // Workshop opslaan (nieuw of update)
  async save(workshop: Workshop): Promise<Workshop> {
    return this.repo.save(workshop);
  }

  // Workshop verwijderen
  async delete(workshop: Workshop): Promise<void> {
    await this.repo.remove(workshop);
  }
}
