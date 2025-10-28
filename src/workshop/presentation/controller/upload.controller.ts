import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { join } from 'path';
import type { Response } from 'express';
import { existsSync } from 'fs';

@Controller('uploads')
export class UploadController {
  private readonly uploadDir = join(
    process.env.HOME || '',
    'wailSalutem.workshop-uploads',
  );

  @Get(':filename')
  getFile(@Param('filename') filename: string, @Res() res: Response) {
    const decoded = decodeURIComponent(filename);
    const filePath = join(this.uploadDir, decoded);

    if (!existsSync(filePath)) {
      throw new NotFoundException(`File ${decoded} not found`);
    }

    return res.sendFile(filePath);
  }
}
