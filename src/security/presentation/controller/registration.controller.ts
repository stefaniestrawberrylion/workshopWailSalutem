import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { UserService } from '../../application/user.service';
import { AdminService } from '../../application/admin.service';
import { Status } from '../../domain/enums/state.enum';
import { Role } from '../../domain/enums/role.enum';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const maybeError = error as { message?: unknown };
    if (typeof maybeError.message === 'string') {
      return maybeError.message;
    }
  }

  return String(error);
}
@Controller('register')
export class RegistrationController {
  constructor(
    private readonly userService: UserService,
    private readonly adminService: AdminService,
  ) {}

  // ================== REGISTRATIE ==================

  @Post()
  async registerUser(@Body() body: Record<string, string>) {
    try {
      await this.userService.register(
        body.email,
        body.password,
        body.firstName,
        body.lastName,
        Role.USER,
      );
      return { message: 'Gebruiker geregistreerd' };
    } catch (err: unknown) {
      throw new HttpException(
        { message: getErrorMessage(err) },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('admin')
  async registerAdmin(@Body() body: Record<string, string>) {
    try {
      await this.adminService.registerAdmin(
        body.email,
        body.password,
        body.firstName,
        body.lastName,
      );
      return { message: 'Admin geregistreerd' };
    } catch (err: unknown) {
      throw new HttpException(
        { message: err instanceof Error ? err.message : String(err) },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('request')
  async registerRequest(@Body() body: Record<string, string>) {
    try {
      await this.userService.registerRequest(
        body.email,
        body.password,
        body.firstName,
        body.lastName,
        body.school,
        body.phone,
      );
      return { success: true };
    } catch (err: unknown) {
      throw new HttpException(
        { success: false, message: getErrorMessage(err) },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ================== PENDING USERS ==================

  @Get('pending')
  async getPendingUsers() {
    try {
      return await this.userService.getPendingUsers();
    } catch (err) {
      console.error('Error fetching pending users:', err);
      throw new HttpException(
        { message: 'Kon pending gebruikers niet ophalen' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('approve/:id')
  async approveUser(@Param('id') id: number) {
    try {
      await this.userService.updateStatus(id, Status.APPROVED);
      return { success: true };
    } catch (err: unknown) {
      throw new HttpException(
        { success: false, message: getErrorMessage(err) },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch('deny/:id')
  async denyUser(@Param('id') id: number) {
    try {
      await this.userService.updateStatus(id, Status.DENIED);
      return { success: true };
    } catch (err: unknown) {
      throw new HttpException(
        { success: false, message: getErrorMessage(err) },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ================== LOGIN ==================

  @Post('login')
  async login(@Body() body: Record<string, string>) {
    const { email, password } = body;

    try {
      // 1) veilig ophalen, vang interne errors van de service op
      let user;
      try {
        user = await this.userService.findByEmail(email);
      } catch (err) {
        console.error('Error in userService.findByEmail:', err);
        throw new HttpException(
          { message: 'Interne serverfout bij gebruiker-lookup' },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // 2) duidelijke checks: eerst null-check, daarna pas password-check
      if (!user) {
        throw new HttpException(
          { message: 'Ongeldige e-mail of wachtwoord' },
          HttpStatus.UNAUTHORIZED,
        );
      }

      const passwordOk = await this.userService.checkPassword(user, password);
      if (!passwordOk) {
        throw new HttpException(
          { message: 'Ongeldige e-mail of wachtwoord' },
          HttpStatus.UNAUTHORIZED,
        );
      }

      // 3) status checks
      if (user.status === Status.DENIED) {
        throw new HttpException(
          { message: 'Uw account is geweigerd door de administrator.' },
          HttpStatus.FORBIDDEN,
        );
      }

      if (user.status === Status.PENDING) {
        throw new HttpException(
          {
            message:
              'Uw account is nog niet goedgekeurd door de administrator.',
          },
          HttpStatus.FORBIDDEN,
        );
      }

      // 4) login & token
      const token = await this.userService.login(user);
      return {
        message: 'Login succesvol',
        ...token,
      };
    } catch (err: unknown) {
      if (err instanceof HttpException) {
        throw err;
      }

      console.error('Unexpected error in register/login:', err);
      throw new HttpException(
        { message: 'Interne serverfout' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':email')
  async deleteUser(@Param('email') email: string) {
    await this.userService.deleteUserByEmail(email);
    return { message: `User with email ${email} has been deleted` };
  }
}
