import {
  Controller,
  Post,
  Body,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from '../../application/auth.service';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() { email, password }: { email: string; password: string },
    @Res() res: Response,
  ) {
    const user = await this.authService.validateUser(email, password);
    const token = await this.authService.login(user);

    res.setHeader('Authorization', `Bearer ${token.access_token}`);
    res.setHeader('Access-Control-Expose-Headers', 'Authorization');
    return res.json(token);
  }
}
