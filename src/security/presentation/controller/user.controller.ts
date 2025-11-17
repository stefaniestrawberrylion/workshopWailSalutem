import {
  Controller,
  Get,
  Delete,
  Param,
  HttpException,
  HttpStatus,
  UseGuards,
  Req,
  Logger,
} from '@nestjs/common';
import { UserService } from '../../application/user.service';
import { Status } from '../../domain/enums/state.enum';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

// ✅ Type-safe helper om foutboodschappen veilig te extraheren (geen any)
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ================== APPROVED USERS ==================
  @Get('approved')
  async getApprovedUsers() {
    return this.userService.getUsersByStatus(Status.APPROVED);
  }

  // ================== DELETE USER ==================
  @Delete(':id')
  async deleteUser(@Param('id') id: number) {
    try {
      await this.userService.deleteUser(id);
      return { success: true };
    } catch (e: unknown) {
      throw new HttpException(
        { success: false, message: getErrorMessage(e) },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Req() req: any) {
    const logger = new Logger('UserController');

    try {
      if (!req.user) {
        logger.warn(
          'Geen user object in request! Misschien AuthGuard niet correct?',
        );
        throw new HttpException(
          'Niet geauthenticeerd',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const userId = req.user.id;
      logger.log(`Ophalen van gebruiker met ID: ${userId}`);

      const user = await this.userService.getUserById(userId);

      if (!user) {
        logger.warn(`Gebruiker met ID ${userId} niet gevonden in database`);
        throw new HttpException(
          'Gebruiker niet gevonden',
          HttpStatus.NOT_FOUND,
        );
      }

      logger.log(`Gebruiker succesvol opgehaald: ${user.email}`);
      return user;
    } catch (err: unknown) {
      logger.error(
        `Fout bij ophalen van profiel: ${getErrorMessage(err)}`,
        err instanceof Error ? err.stack : '',
      );
      throw new HttpException(
        { message: getErrorMessage(err) },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
