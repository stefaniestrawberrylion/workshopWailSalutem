import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Admin } from '../domain/admin.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

  async validateUser(email: string, password: string): Promise<Admin> {
    this.logger.log(`🔍 Validating user: ${email}`);
    const user = await this.adminRepository.findOne({ where: { email } });

    if (!user) {
      this.logger.warn(`⚠️ User not found: ${email}`);
      throw new UnauthorizedException('Ongeldige inloggegevens');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`🚫 Invalid password for user: ${email}`);
      throw new UnauthorizedException('Ongeldige inloggegevens');
    }

    this.logger.log(`✅ User validated successfully: ${email}`);
    return user;
  }

  async login(user: Admin): Promise<{ access_token: string }> {
    this.logger.log(`🎟️ Generating JWT for user: ${user.email}`);

    const payload = {
      sub: user.email,
      email: user.email,
      roles: [user.role],
      iss: 'wailsalutem-workshops',
      aud: 'wailsalutem',
    };

    const secret = this.configService.get<string>('JWT_SECRET');
    const expiresIn = (this.configService.get('JWT_EXPIRATION') ??
      '1h') as JwtSignOptions['expiresIn'];

    const token = await this.jwtService.signAsync(payload, {
      secret,
      expiresIn,
    });

    if (!token) {
      this.logger.error(`❌ Failed to generate token for ${user.email}`);
    } else {
      this.logger.debug(`🪶 JWT payload: ${JSON.stringify(payload)}`);
      this.logger.log(`✅ Token successfully generated for ${user.email}`);
    }

    return { access_token: token };
  }
}
