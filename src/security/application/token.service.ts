import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../domain/user.entity';

/**
 * Type-safe interface voor JWT payload
 */
interface JwtPayload {
  sub: number;
  email: string;
  roles: string[];
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Creëert een access token voor de gegeven gebruiker
   */
  async createAccessToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: [user.role] as string[],
    };

    // Hanteer veilige parsing van JWT_EXPIRATION
    const expiresInSeconds = this.parseExpiration(
      this.configService.get<string>('JWT_EXPIRATION'),
    );

    // Gebruik 'as unknown as Record<string, unknown>' om de NestJS v10 overload issue te omzeilen
    return this.jwtService.signAsync(
      payload as unknown as Record<string, unknown>,
      {
        secret: this.configService.get<string>('JWT_SECRET')!,
        expiresIn: expiresInSeconds,
      },
    );
  }

  /**
   * Converteert een string zoals "1h", "30m" of "3600" naar seconds
   */
  private parseExpiration(exp: string | undefined): number {
    if (!exp) return 3600; // fallback 1 uur
    const match = exp.match(/^(\d+)([smhd])$/);
    if (!match) return Number(exp) || 3600; // fallback 3600s
    const val = Number(match[1]);
    switch (match[2]) {
      case 's':
        return val;
      case 'm':
        return val * 60;
      case 'h':
        return val * 3600;
      case 'd':
        return val * 86400;
      default:
        return 3600;
    }
  }
}
