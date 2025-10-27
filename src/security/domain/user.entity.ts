import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Role } from './enums/role.enum';
import { Status } from './enums/state.enum';

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

  // ===== Helper methods (vergelijkbaar met Spring UserDetails) =====
  getAuthorities(): string[] {
    return [this.role];
  }

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

  isEnabled(): boolean {
    return true;
  }
}
