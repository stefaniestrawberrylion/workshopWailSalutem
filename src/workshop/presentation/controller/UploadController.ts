import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { join } from 'path';
import { promises as fs } from 'fs';
import * as mime from 'mime-types'; // npm install mime-types

@Controller('uploads')
export class UploadsController {
  @Get(':filename')
  async getFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'uploads', filename); // of je Multer path in prod

    try {
      await fs.access(filePath); // async check of file bestaat
    } catch {
      throw new NotFoundException('File not found');
    }

    const contentType = mime.lookup(filePath) || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    return res.sendFile(filePath);
  }
}
