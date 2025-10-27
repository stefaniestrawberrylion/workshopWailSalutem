import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

interface AuthenticatedUser {
  email: string;
  password: string;
  username: string;
  roles: string[];
}

interface JwtPayload {
  sub: string;
  email: string;
  rol: string[];
  iss: string;
  aud: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser> {
    const user: AuthenticatedUser = {
      email: 'admin@example.com',
      password: await bcrypt.hash('password', 10),
      username: 'admin',
      roles: ['ROLE_ADMIN'],
    };

    const isPasswordValid: boolean = await bcrypt.compare(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Ongeldige inloggegevens');
    }

    return user;
  }

  async login(user: AuthenticatedUser): Promise<{ access_token: string }> {
    const payload: JwtPayload = {
      sub: user.username,
      email: user.email,
      rol: user.roles,
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
