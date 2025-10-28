// file.dto.ts
export class FileDto {
  name: string;
  url: string;
  type: 'image' | 'video' | 'document'; // eventueel "document" toevoegen

  constructor(partial?: Partial<FileDto>) {
    this.name = partial?.name ?? '';
    this.url = partial?.url ?? '';
    this.type = partial?.type ?? 'image';
  }
}
