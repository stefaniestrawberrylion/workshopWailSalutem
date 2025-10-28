import { FileDto } from './file.dto';
import { LabelDto } from './label.dto';

export class WorkshopDto {
  id: number;
  name: string;
  description: string;
  duration: string;
  imageUrl: string;
  files: FileDto[];
  labels: LabelDto[];
  reviews: string[];
  documents: FileDto[];
  parentalConsent: boolean;

  constructor(partial?: Partial<WorkshopDto>) {
    this.id = partial?.id ?? 0;
    this.name = partial?.name ?? '';
    this.description = partial?.description ?? '';
    this.duration = partial?.duration ?? '';
    this.imageUrl = partial?.imageUrl ?? '';
    this.files = partial?.files ?? [];
    this.labels = partial?.labels ?? [];
    this.reviews = partial?.reviews ?? [];
    this.documents = partial?.documents ?? [];
    this.parentalConsent = partial?.parentalConsent ?? false;
  }
}
