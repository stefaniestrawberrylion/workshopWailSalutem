import {
  Controller,
  Get,
  Delete,
  Param,
  HttpException,
  HttpStatus,
  UseGuards,
  Req,
  UploadedFile,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from '../../application/user.service';
import { Status } from '../../domain/enums/state.enum';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

interface AuthenticatedRequest extends Request {
  user: { id: number; [key: string]: any };
}

// ✅ Type-safe helper om foutboodschappen veilig te extraheren
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
    try {
      if (!req.user) {
        throw new HttpException(
          'Niet geauthenticeerd',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const userId = req.user.id;
      const user = await this.userService.getUserById(userId);

      if (!user) {
        throw new HttpException(
          'Gebruiker niet gevonden',
          HttpStatus.NOT_FOUND,
        );
      }

      return user;
    } catch (err: unknown) {
      throw new HttpException(
        { message: getErrorMessage(err) },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':id')
  async getUserById(@Param('id') id: number) {
    const user = await this.userService.getUserById(id);
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    return { id: user.id, name: user.firstName, email: user.email };
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const userId = (req as unknown as AuthenticatedRequest).user.id;
          const fileExt = extname(file.originalname);
          const filename = `avatar-${userId}-${Date.now()}${fileExt}`;
          cb(null, filename);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return cb(
            new HttpException(
              'Alleen jpg/jpeg/png zijn toegestaan',
              HttpStatus.BAD_REQUEST,
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!file) {
      throw new HttpException('Geen bestand geüpload', HttpStatus.BAD_REQUEST);
    }

    const userId = req.user.id;
    const avatarUrl = `/uploads/${file.filename}`;
    await this.userService.updateUserAvatar(userId, avatarUrl);

    return { avatarUrl };
  }
}
