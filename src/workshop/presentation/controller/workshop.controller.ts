import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
  NotFoundException,
  Query,
  Put,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { WorkshopService } from '../../application/workshop.service';
import { WorkshopDto } from '../dto/workshop.dto';
import { RolesGuard } from '../../../security/presentation/guards/role.guard';
import { Roles } from '../../../security/presentation/auth/role.decorator';
import { Role } from '../../../security/domain/enums/role.enum';
import { JwtAuthGuard } from '../../../security/presentation/guards/jwt-auth.guard';

// Config constantes
export interface WorkshopFiles {
  image?: Express.Multer.File[];
  media?: Express.Multer.File[];
  instructionsFiles?: Express.Multer.File[];
  manualsFiles?: Express.Multer.File[];
  demoFiles?: Express.Multer.File[];
  worksheetsFiles?: Express.Multer.File[];
  labelsFile?: Express.Multer.File[];
}

const WORKSHOP_FILE_FIELDS = [
  { name: 'image', maxCount: 1 },
  { name: 'media', maxCount: 10 },
  { name: 'instructionsFiles', maxCount: 10 },
  { name: 'manualsFiles', maxCount: 10 },
  { name: 'demoFiles', maxCount: 10 },
  { name: 'worksheetsFiles', maxCount: 10 },
  { name: 'labelsFile', maxCount: 1 },
];

const multerOptions = {
  storage: diskStorage({
    destination: join(process.env.HOME || '', 'wailSalutem.workshop-uploads'),
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`);
    },
  }),
  limits: { fileSize: 200 * 1024 * 1024 },
};

@Controller('/workshops')
export class WorkshopController {
  constructor(private readonly workshopService: WorkshopService) {}

  @Get('top-rated')
  async getTopRated(@Query('limit') limit = '10') {
    const data = await this.workshopService.getTopRatedWithStats(
      parseInt(limit),
    );
    return data.map((w) => this.toDto(w, w.average, w.reviewCount, w.reviews));
  }

  @Get('newest')
  async getNewest(@Query('limit') limit = '10') {
    const data = await this.workshopService.getNewestWithStats(parseInt(limit));
    return data.map((w) => this.toDto(w, w.average, w.reviewCount, w.reviews));
  }

  @Get()
  async getAll() {
    const data = await this.workshopService.getAllWithStats();
    return data.map((w) => this.toDto(w, w.average, w.reviewCount, w.reviews));
  }

  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.workshopService.getWorkshopWithStats(id);
    if (!data.workshop) throw new NotFoundException('Workshop not found');
    return this.toDto(
      data.workshop,
      data.average,
      data.reviewCount,
      data.reviews,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileFieldsInterceptor(WORKSHOP_FILE_FIELDS, multerOptions))
  async create(@Body() body: any, @UploadedFiles() files: WorkshopFiles) {
    const workshop = await this.workshopService.createWorkshopWithParsedLabels(
      body,
      files,
    );
    return this.toDto(workshop);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileFieldsInterceptor(WORKSHOP_FILE_FIELDS, multerOptions))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @UploadedFiles() files: WorkshopFiles,
  ) {
    const result = await this.workshopService.updateWorkshopFull(
      id,
      body,
      files,
    );
    return this.toDto(
      result.workshop,
      result.average,
      result.reviewCount,
      result.reviews,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.workshopService.deleteWorkshop(id);
  }

  private toDto(
    w: any,
    avg?: number,
    count?: number,
    reviews?: any[],
  ): WorkshopDto {
    return new WorkshopDto({
      id: w.id,
      name: w.name,
      description: w.description,
      duration: w.duration,
      imageUrl: w.imagePath,
      parentalConsent: w.parentalConsent,
      files: Array.isArray(w.files)
        ? w.files.map((f) => ({
            name: f.split('/').pop(),
            url: f,
            type: f.match(/\.(mp4|webm)$/i) ? 'video' : 'image',
          }))
        : [],
      quiz:
        typeof w.quizJson === 'string' ? JSON.parse(w.quizJson) : w.quizJson,
      documents:
        typeof w.documentsJson === 'string'
          ? JSON.parse(w.documentsJson)
          : w.documentsJson || [],
      labels:
        typeof w.labelsJson === 'string'
          ? JSON.parse(w.labelsJson)
          : w.labelsJson || [],
      reviews: reviews || [],
      averageStars: avg,
      reviewCount: count,
    });
  }
}
