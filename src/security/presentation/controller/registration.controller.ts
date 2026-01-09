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

// ================== DTOs ==================
class RegisterUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

class RegisterRequestDto extends RegisterUserDto {
  school: string;
  phone: string;
}

class LoginDto {
  email: string;
  password: string;
}

class ResetPasswordDto {
  email: string;
  code: string;
  password: string;
}

// ================== Helper ==================
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return (error as { message?: unknown }).message as string;
  }
  return String(error);
}

// ================== Controller ==================
@Controller('register')
export class RegistrationController {
  constructor(
    private readonly userService: UserService,
    private readonly adminService: AdminService,
  ) {}

  // ------------------ REGISTER ------------------
  @Post()
  async registerUser(@Body() dto: RegisterUserDto) {
    try {
      await this.userService.register(
        dto.email,
        dto.password,
        dto.firstName,
        dto.lastName,
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
  async registerAdmin(@Body() dto: RegisterUserDto) {
    try {
      await this.adminService.registerAdmin(
        dto.email,
        dto.password,
        dto.firstName,
        dto.lastName,
      );
      return { message: 'Admin geregistreerd' };
    } catch (err: unknown) {
      throw new HttpException(
        { message: getErrorMessage(err) },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('request')
  async registerRequest(@Body() dto: RegisterRequestDto) {
    try {
      await this.userService.registerRequest(
        dto.email,
        dto.password,
        dto.firstName,
        dto.lastName,
        dto.school,
        dto.phone,
      );
      return { success: true };
    } catch (err: unknown) {
      throw new HttpException(
        { success: false, message: getErrorMessage(err) },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ------------------ PENDING USERS ------------------
  @Get('pending')
  async getPendingUsers() {
    try {
      return await this.userService.getPendingUsers();
    } catch {
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

  // ------------------ LOGIN ------------------
  @Post('login')
  async login(@Body() dto: LoginDto) {
    const { email, password } = dto;
    try {
      const user = await this.userService.findByEmail(email);
      if (!user)
        throw new HttpException(
          'Ongeldige e-mail of wachtwoord',
          HttpStatus.UNAUTHORIZED,
        );

      if (user.status === Status.DENIED) {
        throw new HttpException(
          'Uw account is geweigerd door de administrator.',
          HttpStatus.FORBIDDEN,
        );
      }
      if (user.status === Status.PENDING) {
        throw new HttpException(
          'Uw account is nog niet goedgekeurd door de administrator.',
          HttpStatus.FORBIDDEN,
        );
      }

      const passwordOk = await this.userService.checkPassword(user, password);
      if (!passwordOk)
        throw new HttpException(
          'Ongeldige e-mail of wachtwoord',
          HttpStatus.UNAUTHORIZED,
        );

      const token = await this.userService.login(user);
      return { message: 'Login succesvol', ...token };
    } catch (err: unknown) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        'Interne serverfout',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ------------------ DELETE USER ------------------
  @Delete(':email')
  async deleteUser(@Param('email') email: string) {
    await this.userService.deleteUserByEmail(email);
    return { message: `User with email ${email} has been deleted` };
  }

  // ------------------ PASSWORD RESET ------------------
  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    await this.userService.requestPasswordReset(email);
    return { success: true };
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.userService.resetPassword(dto.email, dto.code, dto.password);
    return { success: true };
  }
}
