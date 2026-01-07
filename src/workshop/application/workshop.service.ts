import { Injectable, NotFoundException } from '@nestjs/common';
import { WorkshopRepository } from '../data/workshop.repository';
import { CreateWorkshopDto } from '../presentation/dto/create.dto';
import { Workshop } from '../domain/workshop.entity';
import { DocumentInfo } from '../domain/document-info.entity';
import { promises as fs } from 'fs';
import { ReviewService } from './review.service';
import { WorkshopFiles} from '../presentation/controller/workshop.controller';

@Injectable()
export class WorkshopService {
  constructor(
    private readonly workshopRepository: WorkshopRepository,
    private readonly reviewService: ReviewService,
  ) {}

  /**
   * Haalt alle workshops op inclusief statistieken (Gemiddelde & Review count)
   */
  async getAllWithStats() {
    const workshops = await this.workshopRepository.findAll();
    return Promise.all(workshops.map((w) => this.enrichWithStats(w)));
  }

  async getTopRatedWithStats(limit: number) {
    const workshops = await this.getAllWithStats();
    return workshops
      .filter((w) => w.average >= 4)
      .sort((a, b) => b.average - a.average)
      .slice(0, limit);
  }

  async getNewestWithStats(limit: number) {
    const workshops = await this.workshopRepository.findNewest(limit);
    return Promise.all(workshops.map((w) => this.enrichWithStats(w)));
  }

  async getWorkshopWithStats(id: number) {
    const workshop = await this.workshopRepository.findById(id);
    if (!workshop) return { workshop: null };

    const stats = await this.getStatsForWorkshop(id);
    return { workshop, ...stats };
  }

  private async enrichWithStats(workshop: Workshop) {
    const stats = await this.getStatsForWorkshop(workshop.id);
    return { ...workshop, ...stats };
  }

  private async getStatsForWorkshop(id: number) {
    const average = await this.reviewService.getAverageForWorkshop(id);
    const reviewCount = await this.reviewService.getCountForWorkshop(id);
    const reviews = await this.reviewService.findByWorkshop(id);
    return { average, reviewCount, reviews };
  }

  async createWorkshopWithParsedLabels(
    body: any,
    files: WorkshopFiles,
  ): Promise<Workshop> {
    const labels = await this.parseLabels(files, body);
    const data: CreateWorkshopDto = { ...body, labels };

    return this.saveWorkshop(
      data,
      files.image?.[0],
      files.media,
      files.instructionsFiles,
      files.manualsFiles,
      files.demoFiles,
      files.worksheetsFiles,
    );
  }

  async updateWorkshopFull(id: number, body: any, files: WorkshopFiles) {
    if (files.labelsFile || body.labels) {
      body.labels = await this.parseLabels(files, body);
    }

    const workshop = await this.updateWorkshop(
      id,
      body,
      files.image?.[0],
      files.media,
      files.instructionsFiles,
      files.manualsFiles,
      files.demoFiles,
      files.worksheetsFiles,
    );

    const stats = await this.getStatsForWorkshop(id);
    return { workshop, ...stats };
  }

  // --- Bestaande Helper Logica ---

  async saveWorkshop(
    data: CreateWorkshopDto,
    image?: any,
    media?: any[],
    instructionsFiles?: any[],
    manualsFiles?: any[],
    demoFiles?: any[],
    worksheetsFiles?: any[],
  ): Promise<Workshop> {
    const workshop = new Workshop();
    workshop.imagePath = image ? this.saveFile(image) : '';
    workshop.files = this.saveFiles(media);

    const docs: DocumentInfo[] = [
      ...this.createDocumentInfos(instructionsFiles, 'instructions'),
      ...this.createDocumentInfos(manualsFiles, 'manuals'),
      ...this.createDocumentInfos(demoFiles, 'demo'),
      ...this.createDocumentInfos(worksheetsFiles, 'worksheets'),
    ];

    workshop.documentsJson = JSON.stringify(docs);
    workshop.name = data.name;
    workshop.description = data.description;
    workshop.duration = data.duration;
    workshop.labelsJson = JSON.stringify(data.labels ?? []);
    workshop.parentalConsent = String(data.parentalConsent) === 'true';

    if (data.quiz) {
      workshop.quizJson =
        typeof data.quiz === 'string' ? data.quiz : JSON.stringify(data.quiz);
    }

    return this.workshopRepository.save(workshop);
  }

  async updateWorkshop(
    id: number,
    data: Partial<CreateWorkshopDto>,
    image?: any,
    media?: any[],
    instructionsFiles?: any[],
    manualsFiles?: any[],
    demoFiles?: any[],
    worksheetsFiles?: any[],
  ): Promise<Workshop> {
    const workshop = await this.workshopRepository.findById(id);
    if (!workshop) throw new NotFoundException('Workshop not found');

    if (data.name) workshop.name = data.name;
    if (data.description) workshop.description = data.description;
    if (data.duration) workshop.duration = data.duration;
    if (data.labels) workshop.labelsJson = JSON.stringify(data.labels);
    if (data.parentalConsent !== undefined)
      workshop.parentalConsent = String(data.parentalConsent) === 'true';
    if (data.quiz) {
      workshop.quizJson =
        typeof data.quiz === 'string'
          ? data.quiz
          : JSON.stringify(data.quiz);
    }

    if (image) workshop.imagePath = this.saveFile(image);
    if (media?.length)
      workshop.files = [...(workshop.files || []), ...this.saveFiles(media)];

    const newDocs = [
      ...this.createDocumentInfos(instructionsFiles, 'instructions'),
      ...this.createDocumentInfos(manualsFiles, 'manuals'),
      ...this.createDocumentInfos(demoFiles, 'demo'),
      ...this.createDocumentInfos(worksheetsFiles, 'worksheets'),
    ];

    if (newDocs.length) {
      const existing = workshop.documentsJson
        ? JSON.parse(workshop.documentsJson as string)
        : [];
      workshop.documentsJson = JSON.stringify([...existing, ...newDocs]);
    }

    return this.workshopRepository.save(workshop);
  }

  async deleteWorkshop(id: number): Promise<void> {
    const workshop = await this.workshopRepository.findById(id);
    if (workshop) await this.workshopRepository.delete(workshop);
  }

  private saveFile(file: any): string {
    if (!file) return '';
    const path = file.path || '';
    return path.replace(/\\/g, '/').replace(/.*uploads/, '/uploads');
  }

  private saveFiles(files?: any[]): string[] {
    return files ? files.map((f) => this.saveFile(f)) : [];
  }

  private createDocumentInfos(files?: any[], cat?: string): DocumentInfo[] {
    return files
      ? files.map(
          (f) => new DocumentInfo(f.originalname, this.saveFile(f), cat ?? ''),
        )
      : [];
  }

  public async parseLabels(files: any, body: any): Promise<string[]> {
    try {
      if (files.labelsFile?.[0]) {
        const content = await fs.readFile(files.labelsFile[0].path, 'utf8');
        return JSON.parse(content);
      }
      return typeof body.labels === 'string'
        ? JSON.parse(body.labels)
        : body.labels || [];
    } catch {
      return [];
    }
  }
}
