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
  Req,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { WorkshopService } from '../../application/workshop.service';
import { WorkshopDto } from '../dto/workshop.dto';
import { Workshop } from '../../domain/workshop.entity';
import { RolesGuard } from '../../../security/presentation/guards/role.guard';
import { Roles } from '../../../security/presentation/auth/role.decorator';
import { Role } from '../../../security/domain/enums/role.enum';
import { JwtAuthGuard } from '../../../security/presentation/guards/jwt-auth.guard';
import { WorkshopRepository } from '../../data/workshop.repository';
import { ReviewService } from '../../application/review.service';
import { config } from 'dotenv';
config();

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer?: Buffer;
  size: number;
  path?: string;
  filename?: string;
}

interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

// =====================
// Multer configuratie
// =====================
const storage = diskStorage({
  destination: process.env.UPLOAD_DIR || join(process.cwd(), 'uploads/workshops'),
  filename: (req, file, cb) => {
    const safeName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, safeName);
  },
});


const multerOptions = {
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024,
  },
};

@Controller('api/workshops')
export class WorkshopController {
  constructor(
    private readonly workshopService: WorkshopService,
    private readonly workshopRepository: WorkshopRepository,
    private readonly reviewService: ReviewService,
  ) {}

  // =======================
  // Test Auth
  // =======================
  @Get('test-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  testAuth(@Req() req: AuthenticatedRequest) {
    return { user: req.user };
  }

  // =======================
  // Alle workshops ophalen
  // =======================
  @Get()
  async getAllWorkshops(): Promise<WorkshopDto[]> {
    try {
      const workshops = await this.workshopService.getAllWorkshops();

      return Promise.all(
        workshops.map(async (w) => {
          const average = await this.reviewService.getAverageForWorkshop(w.id);
          const count = await this.reviewService.getCountForWorkshop(w.id);
          const reviews = await this.reviewService.findByWorkshop(w.id);

          return this.toDto(w, average, count, reviews);
        }),
      );
    } catch (err) {
      console.error('❌ Error in getAllWorkshops:', err);
      throw err; // laat NestJS de 500 error nog steeds teruggeven
    }
  }
  @Get(':id')
  async getWorkshop(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<WorkshopDto> {
    const workshop = await this.workshopService.getWorkshop(id);
    if (!workshop) throw new NotFoundException('Workshop not found');

    const average = await this.reviewService.getAverageForWorkshop(id);
    const count = await this.reviewService.getCountForWorkshop(id);
    const reviews = await this.reviewService.findByWorkshop(id);

    return this.toDto(workshop, average, count, reviews);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'media', maxCount: 10 },
        { name: 'instructionsFiles', maxCount: 10 },
        { name: 'manualsFiles', maxCount: 10 },
        { name: 'demoFiles', maxCount: 10 },
        { name: 'worksheetsFiles', maxCount: 10 },
        { name: 'labelsFile', maxCount: 1 },
      ],
      multerOptions,
    ),
  )
  async createWorkshop(
    @Req() req: AuthenticatedRequest,
    @Body() body: any,
    @UploadedFiles() files: Record<string, MulterFile[]>,
  ): Promise<WorkshopDto> {
    // Parsing logica is verplaatst naar de service
    const workshop = await this.workshopService.createWorkshopWithParsedLabels(
      body,
      files,
    );

    return this.toDto(workshop);
  }

  // =======================
  // Workshop verwijderen (ADMIN only)
  // =======================
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async deleteWorkshop(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.workshopService.deleteWorkshop(id);
  }

  // =======================
  // Helper: DTO converter
  // =======================
  private toDto(
    w: Workshop,
    averageStars?: number,
    reviewCount?: number,
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
        ? w.files.map((f) => {
            const lower = f.toLowerCase();
            const type =
              lower.endsWith('.mp4') || lower.endsWith('.webm')
                ? 'video'
                : 'image';
            return { name: f.split('/').pop() ?? '', url: f, type };
          })
        : [],
      documents:
        typeof w.documentsJson === 'string'
          ? JSON.parse(w.documentsJson)
          : Array.isArray(w.documentsJson)
            ? w.documentsJson
            : [],
      labels: Array.isArray(w.labelsJson)
        ? w.labelsJson
        : typeof w.labelsJson === 'string'
          ? JSON.parse(w.labelsJson)
          : [],
      reviews: reviews ?? [],
      averageStars,
      reviewCount,
    });
  }
}
