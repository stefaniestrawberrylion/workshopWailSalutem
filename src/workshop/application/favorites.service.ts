import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from '../domain/favorites.entity';
import { User } from '../../security/domain/user.entity';
import { Workshop } from '../domain/workshop.entity';

@Injectable()
export class FavoriteService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoriteRepo: Repository<Favorite>,

    @InjectRepository(Workshop)
    private readonly workshopRepo: Repository<Workshop>,
  ) {}

  async addFavorite(userId: number, workshopId: number) {
    const workshop = await this.workshopRepo.findOne({
      where: { id: workshopId },
    });

    if (!workshop) {
      throw new NotFoundException('Workshop niet gevonden');
    }

    const exists = await this.favoriteRepo.findOne({
      where: {
        user: { id: userId },
        workshop: { id: workshopId },
      },
    });

    if (exists) {
      return exists;
    }

    const favorite = this.favoriteRepo.create({
      user: { id: userId } as User,
      workshop,
    });

    return this.favoriteRepo.save(favorite);
  }

  async removeFavorite(userId: number, workshopId: number) {
    const favorite = await this.favoriteRepo.findOne({
      where: {
        user: { id: userId },
        workshop: { id: workshopId },
      },
    });

    if (!favorite) {
      throw new NotFoundException('Favoriet niet gevonden');
    }

    return this.favoriteRepo.remove(favorite);
  }

  async getFavorites(userId: number) {
    return this.favoriteRepo.find({
      where: { user: { id: userId } },
      relations: ['workshop'],
    });
  }
}
