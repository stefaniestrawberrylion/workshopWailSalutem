import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from './presentation/strategies/jwt.strategy';
import { AuthService } from './application/auth.service';
import { AuthController } from './presentation/controller/auth.controller';
import { Admin } from './domain/admin.entity';
import { JwtSignOptions } from '@nestjs/jwt'; // ✅ importeer type

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([Admin]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const expiresIn: JwtSignOptions['expiresIn'] = (config.get<string>(
          'JWT_EXPIRATION',
        ) ?? '1h') as JwtSignOptions['expiresIn'];

        return {
          secret: config.get<string>('JWT_SECRET') || 'defaultSecret',
          signOptions: { expiresIn },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, AuthService],
  exports: [JwtModule, PassportModule, ConfigModule, JwtStrategy, AuthService],
})
export class SecurityModule {}
