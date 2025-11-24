import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Review } from './review.entity';

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

  @Column({ type: 'json', nullable: true })
  files: string[];

  @Column({ type: 'json', nullable: true })
  labelsJson: any;

  @Column({ type: 'json', nullable: true })
  documentsJson: any;

  @Column({ default: false })
  parentalConsent: boolean;

  // Relatie met Review
  @OneToMany(() => Review, (review) => review.workshop)
  reviews: Review[];
}
