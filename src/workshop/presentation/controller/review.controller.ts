// review/presentation/controllers/review.controller.ts

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ReviewService } from '../../application/review.service';
import { JwtAuthGuard } from '../../../security/presentation/guards/jwt-auth.guard';
import { ParseIntPipe } from '@nestjs/common';

// Request type met user erin
interface AuthRequest extends Request {
  user: {
    id: number;
    email?: string;
    roles?: string[];
  };
}

@Controller('/reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createReview(@Req() req: AuthRequest, @Body() body) {
    const userId = req.user.id;

    const review = await this.reviewService.createOrUpdateReview(
      userId,
      body.workshopId,
      body.stars,
      body.text,
    );

    return review;
  }
  // Nieuw endpoint: Haal de review van de HUIDIGE GEBRUIKER voor een specifieke workshop op
  @Get(':workshopId/user')
  @UseGuards(JwtAuthGuard) // Vereist authenticatie om de userId te krijgen
  async getUserReviewForWorkshop(
    @Req() req: AuthRequest,
    @Param('workshopId', ParseIntPipe) workshopId: number,
  ) {
    console.log('--- GET USER REVIEW FOR WORKSHOP ---');
    console.log('Workshop ID:', workshopId);
    console.log('User ID:', req.user.id);

    const userId = req.user.id;

    // U moet een nieuwe methode in ReviewService implementeren: findByUserAndWorkshop
    const review = await this.reviewService.findByUserAndWorkshop(
      userId,
      workshopId,
    );

    if (!review) {
      // Dit zorgt ervoor dat de frontend een 404 krijgt, wat de loadReviews
      // functie correct afhandelt door de review-popup leeg te maken.
      throw new NotFoundException(
        'Review not found for this user and workshop.',
      );
    }

    return review;
  }

  @Get(':workshopId')
  async getWorkshopReviews(@Param('workshopId') workshopId: number) {
    console.log('--- GET REVIEWS ---');
    console.log('Workshop ID:', workshopId);

    const reviews = await this.reviewService.findByWorkshop(workshopId);
    console.log('Found reviews:', reviews);

    return reviews;
  }
}
