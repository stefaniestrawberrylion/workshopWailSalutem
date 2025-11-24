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
}
