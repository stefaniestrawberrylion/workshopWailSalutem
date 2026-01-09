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
import { MailService } from '../../../mail/application/mail.service';

interface AuthenticatedRequest extends Request {
  user: { id: number; [key: string]: any };
}

// Helper om foutboodschappen veilig te extraheren
const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly mailService: MailService,
  ) {}

  // ================== APPROVED USERS ==================
  @Get('approved')
  async getApprovedUsers() {
    return this.userService.getUsersByStatus(Status.APPROVED);
  }

  // ================== PROFILE ==================
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Req() req: AuthenticatedRequest) {
    try {
      const user = await this.userService.getUserById(req.user.id);
      if (!user)
        throw new HttpException(
          'Gebruiker niet gevonden',
          HttpStatus.NOT_FOUND,
        );
      return user;
    } catch (err: unknown) {
      throw new HttpException(
        { message: getErrorMessage(err) },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ================== DELETE OWN ACCOUNT ==================
  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async deleteMe(@Req() req: AuthenticatedRequest) {
    try {
      const userId = req.user.id;
      const user = await this.userService.getUserById(userId);
      if (!user)
        throw new HttpException(
          'Gebruiker niet gevonden',
          HttpStatus.NOT_FOUND,
        );

      await this.userService.deleteUser(userId);
      await this.mailService.sendAccountDeletionNotification(
        user.email,
        `${user.firstName} ${user.lastName}`,
      );

      return { success: true, message: 'Account succesvol verwijderd' };
    } catch (err: unknown) {
      throw new HttpException(
        { success: false, message: getErrorMessage(err) },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ================== DELETE USER BY ID ==================
  @Delete(':id')
  async deleteUser(@Param('id') id: number) {
    try {
      await this.userService.deleteUser(id);
      return { success: true };
    } catch (err: unknown) {
      throw new HttpException(
        { success: false, message: getErrorMessage(err) },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ================== GET USER BY ID ==================
  @Get(':id')
  async getUserById(@Param('id') id: number) {
    const user = await this.userService.getUserById(id);
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    return { id: user.id, name: user.firstName, email: user.email };
  }

  // ================== UPLOAD AVATAR ==================
  @UseGuards(JwtAuthGuard)
  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const userId = (req as unknown as AuthenticatedRequest).user.id;
          const fileExt = extname(file.originalname);
          cb(null, `avatar-${userId}-${Date.now()}${fileExt}`);
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
    if (!file)
      throw new HttpException('Geen bestand geüpload', HttpStatus.BAD_REQUEST);

    const avatarUrl = `/uploads/${file.filename}`;
    await this.userService.updateUserAvatar(req.user.id, avatarUrl);

    return { avatarUrl };
  }
}
