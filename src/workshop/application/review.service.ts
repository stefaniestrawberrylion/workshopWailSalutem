import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../domain/review.entity';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly repo: Repository<Review>,
  ) {}

  async createOrUpdateReview(
    userId: number,
    workshopId: number,
    stars: number,
    text: string,
  ) {
    const existing = await this.repo.findOne({
      where: { userId, workshopId },
    });

    if (existing) {
      existing.stars = stars;
      existing.text = text;
      return this.repo.save(existing); // UPDATE
    }

    const review = this.repo.create({
      userId,
      workshopId,
      stars,
      text,
    });

    return this.repo.save(review); // INSERT
  }

  async findByWorkshop(workshopId: number) {
    return this.repo.find({
      where: { workshopId },
      order: { id: 'DESC' },
    });
  }

  async findByUserAndWorkshop(userId: number, workshopId: number) {
    return this.repo.findOne({ where: { userId, workshopId } });
  }

  async getAverageForWorkshop(workshopId: number) {
    const result = await this.repo
      .createQueryBuilder('r')
      .select('AVG(r.stars)', 'avg')
      .where('r.workshopId = :id', { id: workshopId })
      .getRawOne();

    return Number(result?.avg) || 0;
  }

  async getCountForWorkshop(workshopId: number) {
    return this.repo.count({ where: { workshopId } });
  }
}
