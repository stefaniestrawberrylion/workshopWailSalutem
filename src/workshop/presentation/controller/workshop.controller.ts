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
  Query,
  Put,
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
  destination: join(process.env.HOME || '', 'wailSalutem.workshop-uploads'),
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

@Controller('/workshops')
export class WorkshopController {
  constructor(
    private readonly workshopService: WorkshopService,
    private readonly workshopRepository: WorkshopRepository,
    private readonly reviewService: ReviewService,
  ) {}

  // =======================
  // NIEUW: Top Gewaardeerde Workshops (voor dashboard)
  // =======================
  @Get('top-rated')
  async getTopRatedWorkshops(
    @Query('limit') limit?: string,
  ): Promise<WorkshopDto[]> {
    const workshops = await this.workshopService.getTopRatedWorkshops(
      parseInt(limit ?? '10', 10),
    );

    return Promise.all(
      workshops.map(async (w) => {
        const reviews = await this.reviewService.findByWorkshop(w.id);
        return this.toDto(w, w.average, reviews.length, reviews);
      }),
    );
  }

  // =======================
  // NIEUW: Nieuwste Workshops (voor dashboard)
  // =======================
  @Get('newest')
  async getNewestWorkshops(
    @Query('limit') limit?: string,
  ): Promise<WorkshopDto[]> {
    // FIX TS2345: Gebruik parseInt(limit ?? '2', 10) om undefined te voorkomen
    const workshops = await this.workshopService.getNewestWorkshops(
      parseInt(limit ?? '10', 10),
    );

    // FIX ESLint: Expliciet casten van Promise.all resultaat naar WorkshopDto[]
    return Promise.all<WorkshopDto>(
      workshops.map(async (w) => {
        const average = await this.reviewService.getAverageForWorkshop(w.id);
        const count = await this.reviewService.getCountForWorkshop(w.id);
        const reviews = await this.reviewService.findByWorkshop(w.id);

        return this.toDto(w, average, count, reviews);
      }),
    );
  }

  // =======================
  // Alle workshops ophalen (Ongewijzigd)
  // =======================
  @Get()
  async getAllWorkshops(): Promise<WorkshopDto[]> {
    const workshops = await this.workshopService.getAllWorkshops();

    // FIX ESLint: Expliciet casten van Promise.all resultaat naar WorkshopDto[]
    return Promise.all<WorkshopDto>(
      workshops.map(async (w) => {
        const average = await this.reviewService.getAverageForWorkshop(w.id);
        const count = await this.reviewService.getCountForWorkshop(w.id);
        const reviews = await this.reviewService.findByWorkshop(w.id);

        return this.toDto(w, average, count, reviews);
      }),
    );
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
    const workshop = await this.workshopService.createWorkshopWithParsedLabels(
      body,
      files,
    );

    return this.toDto(workshop);
  }
  //Update workshop

  @Put(':id')
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
  async updateWorkshop(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
    @Body() body: any,
    @UploadedFiles() files: Record<string, MulterFile[]>,
  ): Promise<WorkshopDto> {
    // Labels parsen indien aanwezig
    if (files.labelsFile || body.labels) {
      body.labels = await this.workshopService.parseLabels(files, body);
    }

    const workshop = await this.workshopService.updateWorkshop(
      id,
      body,
      files.image?.[0],
      files.media,
      files.instructionsFiles,
      files.manualsFiles,
      files.demoFiles,
      files.worksheetsFiles,
    );

    // Reviews en gemiddelde ophalen voor DTO
    const average = await this.reviewService.getAverageForWorkshop(id);
    const count = await this.reviewService.getCountForWorkshop(id);
    const reviews = await this.reviewService.findByWorkshop(id);

    return this.toDto(workshop, average, count, reviews);
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
  // Helper: DTO converter (Ongewijzigd)
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
      quiz: Array.isArray(w.quizJson)
        ? w.quizJson
        : typeof w.quizJson === 'string'
          ? JSON.parse(w.quizJson)
          : null,

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
