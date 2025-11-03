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

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
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

// ✅ Multer configuratie: schrijft naar disk en laat tot 200 MB toe
const storage = diskStorage({
  destination: join(process.cwd(), 'uploads'), // gebruik absolute pad
  filename: (req, file, cb) => {
    const safeName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, safeName);
  },
});

const multerOptions = {
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // max 200 MB per file
  },
};

@Controller('api/workshops')
export class WorkshopController {
  constructor(private readonly workshopService: WorkshopService) {}

  @Get('test-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  testAuth(@Req() req: AuthenticatedRequest) {
    console.log('req.user:', req.user);
    return { user: req.user };
  }

  // =======================
  // Alle workshops ophalen
  // =======================
  @Get()
  async getAllWorkshops(): Promise<WorkshopDto[]> {
    const workshops = await this.workshopService.getAllWorkshops();
    return workshops.map((w) => this.toDto(w));
  }

  @Get(':id')
  async getWorkshop(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<WorkshopDto> {
    const workshop = await this.workshopService.getWorkshop(id);
    if (!workshop) throw new NotFoundException('Workshop not found');
    return this.toDto(workshop);
  }

  // =======================
  // Workshop toevoegen (ADMIN only)
  // =======================
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
      ],
      multerOptions, // ✅ gebruik custom configuratie
    ),
  )
  async createWorkshop(
    @Req() req: AuthenticatedRequest,
    @Body() body: any,
    @UploadedFiles() files: Record<string, MulterFile[]>,
  ): Promise<WorkshopDto> {
    console.log('📝 Body received before parsing:', body);

    if (typeof body.labels === 'string') {
      try {
        body.labels = JSON.parse(body.labels);
      } catch (err) {
        console.error('❌ Error parsing labels JSON:', err);
        body.labels = [];
      }
    }

    console.log('📦 Parsed body:', body);
    console.log('📁 Uploaded files:', Object.keys(files));

    try {
      const workshop = await this.workshopService.saveWorkshop(
        body,
        files.image?.[0],
        files.media,
        files.instructionsFiles,
        files.manualsFiles,
        files.demoFiles,
        files.worksheetsFiles,
      );
      console.log('✅ Workshop saved:', workshop);
      return this.toDto(workshop);
    } catch (err) {
      console.error('💥 Error in createWorkshop:', err);
      throw err;
    }
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
  private toDto(w: Workshop): WorkshopDto {
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
      labels:
        typeof w.labelsJson === 'string'
          ? JSON.parse(w.labelsJson)
          : Array.isArray(w.labelsJson)
            ? w.labelsJson
            : [],
    });
  }
}
