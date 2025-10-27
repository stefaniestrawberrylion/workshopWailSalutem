import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../../domain/interfaces/jwt-payload.interfaces';
import { UserProfile } from '../../domain/interfaces/user-profile.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET'),
      ignoreExpiration: false,
    });
  }

  validate(payload: JwtPayload): UserProfile {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid JWT token');
    }

    return {
      username: payload.sub,
      email: payload.email ?? '',
      firstName: payload.firstName ?? '',
      lastName: payload.lastName ?? '',
      roles: payload.rol ?? [],
    };
  }
}
