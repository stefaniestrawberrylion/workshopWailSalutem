import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Workshop {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  duration: string;

  @Column({ nullable: true })
  imagePath: string;

  // Media opslaan als array van URLs
  @Column({ type: 'json', nullable: true })
  files: string[];

  // Labels opslaan als JSON
  @Column({ type: 'json', nullable: true })
  labelsJson: any;

  // Documenten opslaan als JSON
  @Column({ type: 'json', nullable: true })
  documentsJson: any;

  @Column({ default: false })
  parentalConsent: boolean;
}
