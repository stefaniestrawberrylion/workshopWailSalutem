import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../src/security/application/user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/security/domain/user.entity';
import { Admin } from '../src/security/domain/admin.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../src/mail/application/mail.service';
import { Status } from '../src/security/domain/enums/state.enum';
import { NotFoundException } from '@nestjs/common';
import { Role } from '../src/security/domain/enums/role.enum';

// ---------------- MockUser class ----------------
class MockUser implements Partial<User> {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: Role;
  status: Status;
  avatarUrl?: string;
  school?: string;
  phone?: string;
  favorites: any[] = [];

  // User methods als arrow functions
  getUsername = (): string => this.email;
  isAccountNonExpired = (): boolean => true;
  isAccountNonLocked = (): boolean => true;
  isCredentialsNonExpired = (): boolean => true;
  isEnabled = (): boolean => true;

  constructor(data: Partial<User>) {
    Object.assign(this, data);
  }
}

// ---------------- TESTS ----------------
describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<Repository<User>>;
  let mailService: jest.Mocked<MailService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        JwtService,
        ConfigService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(() => Promise.resolve(null)),
            create: jest.fn((dto: Partial<User>) => new MockUser(dto) as User),
            save: jest.fn((user: User) => Promise.resolve(user)),
            delete: jest.fn(() => Promise.resolve({ affected: 1 })),
          },
        },
        {
          provide: getRepositoryToken(Admin),
          useValue: {},
        },
        {
          provide: MailService,
          useValue: {
            sendUserStatus: jest.fn(() => Promise.resolve()),
            sendAdminNotification: jest.fn(() => Promise.resolve()),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(getRepositoryToken(User));
    mailService = module.get(MailService);
  });

  describe('updateStatus', () => {
    it('should update status to APPROVED and send email', async () => {
      const user = new MockUser({
        id: 1,
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'hashed',
        role: Role.USER,
        status: Status.PENDING,
      });

      userRepository.findOne.mockResolvedValue(user as User);

      await service.updateStatus(1, Status.APPROVED);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(userRepository.save).toHaveBeenCalledWith({
        ...user,
        status: Status.APPROVED,
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mailService.sendUserStatus).toHaveBeenCalledWith(
        'test@test.com',
        'goedgekeurd',
      );
    });

    it('should delete user if status is DENIED and send email', async () => {
      const user = new MockUser({
        id: 1,
        email: 'deny@test.com',
        firstName: 'Deny',
        lastName: 'User',
        password: 'hashed',
        role: Role.USER,
        status: Status.PENDING,
      });

      userRepository.findOne.mockResolvedValue(user as User);

      await service.updateStatus(1, Status.DENIED);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(userRepository.delete).toHaveBeenCalledWith(1);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mailService.sendUserStatus).toHaveBeenCalledWith(
        'deny@test.com',
        'afgewezen',
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.updateStatus(99, Status.APPROVED)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
