// label.dto.ts
export class LabelDto {
  name: string;
  color: string;

  constructor(partial?: Partial<LabelDto>) {
    this.name = partial?.name ?? '';
    this.color = partial?.color ?? '#000000';
  }
}
