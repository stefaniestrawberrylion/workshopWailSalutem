import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkshopController } from '../controller/workshop.controller';
import { WorkshopService } from '../../application/workshop.service';
import { WorkshopRepository } from '../../data/workshop.repository';
import { Workshop } from '../../domain/workshop.entity';
import { DocumentInfo } from '../../domain/document-info.entity';
import { ReviewModule } from './review.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workshop, DocumentInfo]),
    ReviewModule, // <-- import the module here
  ],
  controllers: [WorkshopController],
  providers: [WorkshopService, WorkshopRepository], // <-- only providers here
  exports: [WorkshopService],
})
export class WorkshopModule {}
