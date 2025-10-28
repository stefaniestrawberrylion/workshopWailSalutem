import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Role } from './enums/role.enum';
import { Status } from './enums/state.enum';

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'enum', enum: Status, default: Status.APPROVED })
  status: Status;

  @Column({ type: 'enum', enum: Role, default: Role.ADMIN })
  role: Role;
}
