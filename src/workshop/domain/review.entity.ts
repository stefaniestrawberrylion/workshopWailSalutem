import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Workshop } from './workshop.entity';
import { User } from '../../security/domain/user.entity';

@Entity()
@Unique(['userId', 'workshopId'])
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

  @ManyToOne(() => Workshop, (workshop) => workshop.reviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workshopId' })
  workshop: Workshop;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
