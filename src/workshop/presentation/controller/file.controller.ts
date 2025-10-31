import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { FileService } from '../../application/file.service';

@Controller('uploads')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get(':id')
  async getFile(@Param('id') id: string, @Res() res: Response) {
    const file = await this.fileService.getFileById(id);

    if (!file) {
      return res.status(404).send('File not found');
    }

    res.set({
      'Content-Type': file.mimeType || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${encodeURIComponent(file.name)}"`,
    });

    // file.data is een Buffer (BLOB)
    res.send(file.data);
  }
}
