import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Req,
  NotFoundException,
  HttpCode,
} from '@nestjs/common';
import type { Request } from 'express';
import { ReviewService } from '../../application/review.service';
import { JwtAuthGuard } from '../../../security/presentation/guards/jwt-auth.guard';
import { ParseIntPipe } from '@nestjs/common';
import { RespondToReviewDto } from '../dto/RespondToReviewDTO';
import { Roles } from '../../../security/presentation/auth/role.decorator';
import { Role } from '../../../security/domain/enums/role.enum';
import { RolesGuard } from '../../../security/presentation/guards/role.guard';

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

    const review = await this.reviewService.findByUserAndWorkshop(
      userId,
      workshopId,
    );

    if (!review) {
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':id/respond')
  @HttpCode(200)
  async respondToReview(
    @Param('id', ParseIntPipe) reviewId: number,
    @Body() dto: RespondToReviewDto,
  ) {
    return this.reviewService.respondToReview(
      reviewId,
      dto.userEmail,
      dto.workshopTitle,
      dto.adminResponse,
    );
  }
}
