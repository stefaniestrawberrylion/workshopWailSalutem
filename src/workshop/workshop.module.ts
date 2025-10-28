import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkshopController } from './presentation/controller/workshop.controller';
import { WorkshopService } from './application/workshop.service';
import { WorkshopRepository } from './data/workshop.repository';
import { Workshop } from './domain/workshop.entity';
import { DocumentInfo } from './domain/document-info.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Workshop, DocumentInfo])],
  controllers: [WorkshopController],
  providers: [WorkshopService, WorkshopRepository],
  exports: [WorkshopService],
})
export class WorkshopModule {}
