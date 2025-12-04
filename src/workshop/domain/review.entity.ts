import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  workshopId: number;

  @Column()
  userId: number;

  @Column()
  stars: number;

  @Column({ type: 'text' })
  text: string;
  @Column({ type: 'timestamp', nullable: true })
  adminRespondedAt: Date | null; // Wanneer de admin gereageerd heeft

  @Column({ type: 'text', nullable: true })
  adminResponseText: string | null;
}
