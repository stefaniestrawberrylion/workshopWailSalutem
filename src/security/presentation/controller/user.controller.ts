import {
  Controller,
  Get,
  Delete,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from '../../application/user.service';
import { Status } from '../../domain/enums/state.enum';

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
}
