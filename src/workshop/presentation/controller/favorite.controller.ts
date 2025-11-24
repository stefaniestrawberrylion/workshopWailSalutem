// favorites.controller.ts
import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../security/presentation/guards/jwt-auth.guard';
import { FavoriteService } from '../../application/favorites.service';

interface AuthRequest extends Request {
  user: {
    id: number;
  };
}

@Controller('favorites') // Dit maakt de base route /favorites
@UseGuards(JwtAuthGuard)
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Post()
  async addFavorite(
    @Req() req: AuthRequest,
    @Body('workshopId') workshopId: number,
  ) {
    return this.favoriteService.addFavorite(req.user.id, workshopId);
  }

  @Delete() // DELETE /favorites
  async removeFavorite(
    @Req() req: AuthRequest,
    @Body('workshopId') workshopId: number,
  ) {
    return this.favoriteService.removeFavorite(req.user.id, workshopId);
  }

  @Get() // GET /favorites
  async getFavorites(@Req() req: AuthRequest) {
    return this.favoriteService.getFavorites(req.user.id);
  }
}
