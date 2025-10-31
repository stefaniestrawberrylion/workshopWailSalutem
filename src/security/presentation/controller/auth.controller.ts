import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AuthService } from '../../application/auth.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() { email, password }: { email: string; password: string },
  ) {
    this.logger.log(`🔑 Login attempt for email: ${email}`);

    const user = await this.authService.validateUser(email, password);
    this.logger.log(`✅ User validated: ${user.email} (role: ${user.role})`);

    const token = await this.authService.login(user);

    if (token?.access_token) {
      this.logger.log(`🟢 Token generated successfully for ${email}`);
    } else {
      this.logger.error(`❌ No token generated for ${email}`);
    }

    return token;
  }
}
