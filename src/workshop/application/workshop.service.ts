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
  buffer: Buffer;
  size: number;
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

    workshop.imagePath = image ? await this.saveFile(image) : '';

    // Media opslaan
    workshop.files = await this.saveFiles(media);

    // Documenten opslaan
    const documents: DocumentInfo[] = [
      ...(await this.createDocumentInfos(instructionsFiles, 'instructions')),
      ...(await this.createDocumentInfos(manualsFiles, 'manuals')),
      ...(await this.createDocumentInfos(demoFiles, 'demo')),
      ...(await this.createDocumentInfos(worksheetsFiles, 'worksheets')),
    ];
    // JSON-string opslaan
    workshop.documentsJson = JSON.stringify(documents);

    workshop.name = data.name;
    workshop.description = data.description;
    workshop.duration = data.duration;
    // Labels ook als JSON-string opslaan
    workshop.labelsJson = JSON.stringify(data.labels ?? []);
    workshop.parentalConsent = data.parentalConsent ?? false;

    return this.workshopRepository.save(workshop);
  }

  // Helpers
  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  private async saveFile(file: MulterFile): Promise<string> {
    const fileName = `${Date.now()}_${file.originalname}`;
    const filePath = join(this.uploadDir, fileName);
    await fs.writeFile(filePath, file.buffer);
    return `/uploads/${fileName}`;
  }

  private async saveFiles(files?: MulterFile[]): Promise<string[]> {
    if (!files) return [];
    const paths: string[] = [];
    for (const file of files) {
      paths.push(await this.saveFile(file));
    }
    return paths;
  }

  private async createDocumentInfos(
    files?: MulterFile[],
    category?: string,
  ): Promise<DocumentInfo[]> {
    if (!files) return [];
    const docs: DocumentInfo[] = [];
    for (const f of files) {
      // category default op 'unknown' als het undefined is
      docs.push(
        new DocumentInfo(
          f.originalname,
          await this.saveFile(f),
          category ?? 'unknown',
        ),
      );
    }
    return docs;
  }
}
