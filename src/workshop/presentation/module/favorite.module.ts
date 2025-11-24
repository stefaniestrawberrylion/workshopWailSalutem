// favorite.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoriteService } from '../../application/favorites.service';
import { FavoriteController } from '../controller/favorite.controller';
import { Favorite } from '../../domain/favorites.entity';
import { Workshop } from '../../domain/workshop.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Favorite, Workshop])],
  controllers: [FavoriteController], // ← Voeg controller toe
  providers: [FavoriteService],
  exports: [FavoriteService],
})
export class FavoriteModule {}