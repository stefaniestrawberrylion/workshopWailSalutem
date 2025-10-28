import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from './presentation/strategies/jwt.strategy';
import { AuthService } from './application/auth.service';
import { AuthController } from './presentation/controller/auth.controller';
import { Admin } from './domain/admin.entity'; // Je Admin entity

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([Admin]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'defaultSecret',
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRATION') ?? '1h', // nullish coalescing
        } as any, // forceer type
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, AuthService], // AdminRepository niet hier
  exports: [JwtStrategy, AuthService],
})
export class SecurityModule {}
