import {
  Body,
  Controller,
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
        { message: getErrorMessage(err) },
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
    return this.userService.getPendingUsers();
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
    const user = await this.userService.findByEmail(email);

    if (!user || !(await this.userService.checkPassword(user, password))) {
      throw new HttpException(
        { message: 'Ongeldige e-mail of wachtwoord' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (user.status !== Status.APPROVED) {
      throw new HttpException(
        { message: 'Account nog niet goedgekeurd door admin' },
        HttpStatus.FORBIDDEN,
      );
    }

    console.log(`Login succesvol voor gebruiker: ${user.email}`);
    console.log(`Rol van gebruiker: ${user.role}`);

    return { message: 'Login succesvol' };
  }
}
