import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Admin } from '../domain/admin.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

  async validateUser(email: string, password: string): Promise<Admin> {
    const user = await this.adminRepository.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Ongeldige inloggegevens');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      throw new UnauthorizedException('Ongeldige inloggegevens');

    return user;
  }

  async login(user: Admin): Promise<{ access_token: string }> {
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

    return { access_token: token };
  }
}
