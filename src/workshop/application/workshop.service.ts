import { Injectable, NotFoundException } from '@nestjs/common';
import { WorkshopRepository } from '../data/workshop.repository';
import { CreateWorkshopDto } from '../presentation/dto/create.dto';
import { Workshop } from '../domain/workshop.entity';
import { DocumentInfo } from '../domain/document-info.entity';
import { join } from 'path';
import { promises as fs } from 'fs';

export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer?: Buffer;
  size: number;
  path?: string;
  filename?: string;
}

@Injectable()
export class WorkshopService {
  private readonly uploadDir = join(
    process.env.HOME || '',
    'wailSalutem.workshop-uploads',
  );

  constructor(private readonly workshopRepository: WorkshopRepository) {}

  async getAllWorkshops(): Promise<Workshop[]> {
    return this.workshopRepository.findAll();
  }

  async getWorkshop(id: number): Promise<Workshop> {
    const workshop = await this.workshopRepository.findById(id);
    if (!workshop)
      throw new NotFoundException(`Workshop not found with id: ${id}`);
    return workshop;
  }

  async deleteWorkshop(id: number): Promise<void> {
    const workshop = await this.getWorkshop(id);
    await this.workshopRepository.delete(workshop);
  }

  async saveWorkshop(
    data: CreateWorkshopDto,
    image?: MulterFile,
    media?: MulterFile[],
    instructionsFiles?: MulterFile[],
    manualsFiles?: MulterFile[],
    demoFiles?: MulterFile[],
    worksheetsFiles?: MulterFile[],
  ): Promise<Workshop> {
    await this.ensureUploadDir();

    const workshop = new Workshop();

    workshop.imagePath = image ? this.saveFile(image) : '';

    workshop.files = this.saveFiles(media);

    const documents: DocumentInfo[] = [
      ...this.createDocumentInfos(instructionsFiles, 'instructions'),
      ...this.createDocumentInfos(manualsFiles, 'manuals'),
      ...this.createDocumentInfos(demoFiles, 'demo'),
      ...this.createDocumentInfos(worksheetsFiles, 'worksheets'),
    ];

    workshop.documentsJson = JSON.stringify(documents);
    workshop.name = data.name;
    workshop.description = data.description;
    workshop.duration = data.duration;
    workshop.labelsJson = JSON.stringify(data.labels ?? []);
    workshop.parentalConsent = String(data.parentalConsent) === 'true';
    return this.workshopRepository.save(workshop);
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  private saveFile(file: MulterFile): string {
    if (!file) return '';
    const absolutePath =
      file.path ?? join(process.cwd(), 'uploads', file.filename ?? '');
    const relativePath = absolutePath
      .replace(process.cwd(), '')
      .replace(/\\/g, '/'); // Windows fix
    return relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  }

  private saveFiles(files?: MulterFile[]): string[] {
    if (!files) return [];
    const paths: string[] = [];
    for (const file of files) {
      paths.push(this.saveFile(file));
    }
    return paths;
  }

  private async parseLabels(
    files: Record<string, MulterFile[]>,
    body: any,
  ): Promise<string[]> {
    try {
      let parsed: unknown = [];

      if (files.labelsFile?.[0]?.path) {
        const json = await fs.readFile(files.labelsFile[0].path, 'utf8');
        parsed = JSON.parse(json);
      } else if (typeof body.labels === 'string') {
        parsed = JSON.parse(body.labels);
      }

      if (Array.isArray(parsed)) {
        return parsed as string[];
      }

      return [];
    } catch {
      return [];
    }
  }

  async createWorkshopWithParsedLabels(
    body: any,
    files: Record<string, MulterFile[]>,
  ): Promise<Workshop> {
    body.labels = await this.parseLabels(files, body);

    return this.saveWorkshop(
      body,
      files.image?.[0],
      files.media,
      files.instructionsFiles,
      files.manualsFiles,
      files.demoFiles,
      files.worksheetsFiles,
    );
  }

  private createDocumentInfos(
    files?: MulterFile[],
    category?: string,
  ): DocumentInfo[] {
    if (!files) return [];
    const docs: DocumentInfo[] = [];
    for (const f of files) {
      docs.push(
        new DocumentInfo(
          f.originalname,
          this.saveFile(f),
          category ?? 'unknown',
        ),
      );
    }
    return docs;
  }
}
