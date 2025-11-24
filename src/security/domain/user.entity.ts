import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Favorite } from '../../workshop/domain/favorites.entity';
import { Role } from './enums/role.enum';
import { Status } from './enums/state.enum';
import { OneToMany } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ nullable: false })
  password: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  @Column({
    type: 'enum',
    enum: Status,
    default: Status.PENDING,
  })
  status: Status;

  @Column({ nullable: false })
  school: string;

  @Column({ nullable: false })
  phone: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  getUsername(): string {
    return this.email;
  }

  isAccountNonExpired(): boolean {
    return true;
  }

  isAccountNonLocked(): boolean {
    return true;
  }

  isCredentialsNonExpired(): boolean {
    return true;
  }
  @OneToMany(() => Favorite, (favorite) => favorite.user)
  favorites: Favorite[];
}
