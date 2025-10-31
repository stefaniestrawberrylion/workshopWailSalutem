import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('files')
export class StoredFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  mimeType: string;

  @Column({ type: 'longblob' })
  data: Buffer;
}
