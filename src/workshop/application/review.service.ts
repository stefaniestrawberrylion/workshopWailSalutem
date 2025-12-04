import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../domain/review.entity';
import { MailService } from '../../mail/application/mail.service';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly repo: Repository<Review>,
    private readonly mailService: MailService,
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

  /**
   * Verzend een reactie op een review en logt de actie.
   * @param reviewId Het ID van de review.
   * @param userEmail Het e-mailadres van de reviewer.
   * @param workshopTitle De titel van de workshop (voor de e-mail template).
   * @param adminResponse De bewerkte tekst van de admin.
   */
  async respondToReview(
    reviewId: number,
    userEmail: string,
    workshopTitle: string, // Optioneel, voor de e-mailinhoud
    adminResponse: string,
  ) {
    // 1. E-mail verzenden
    const subject = `Vraag over uw review voor ${workshopTitle}`;

    // De response tekst is de volledige bewerkte e-mail body
    await this.mailService.sendGenericEmail(userEmail, subject, adminResponse);

    // 2. Log de actie in de database
    const review = await this.repo.findOneBy({ id: reviewId });
    if (review) {
      review.adminRespondedAt = new Date();
      review.adminResponseText = adminResponse;
      await this.repo.save(review);
      return review;
    }

    throw new Error('Review niet gevonden.');
  }
}
