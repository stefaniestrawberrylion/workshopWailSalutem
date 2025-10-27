import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { join } from 'path';

@Controller()
export class PageController {
  @Get('inlog')
  showLogin(@Res() res: Response) {
    return res.sendFile(
      join(__dirname, '..', '..', '..', 'public', 'html', 'inLog.html'),
    );
  }

  @Get('toevoegen')
  showWorkshopToevoegen(@Res() res: Response) {
    return res.sendFile(
      join(
        __dirname,
        '..',
        '..',
        '..',
        'public',
        'html',
        'admin',
        'workshopToevoegen.html',
      ),
    );
  }

  @Get('dashboard')
  showDashboard(@Res() res: Response) {
    return res.sendFile(
      join(
        __dirname,
        '..',
        '..',
        '..',
        'public',
        'html',
        'admin',
        'dashboardAdmin.html',
      ),
    );
  }

  @Get('dashboardUser')
  showDashboardUser(@Res() res: Response) {
    return res.sendFile(
      join(
        __dirname,
        '..',
        '..',
        '..',
        'public',
        'html',
        'user',
        'dashboardUser.html',
      ),
    );
  }

  @Get('workshopUser')
  showWorkshopUser(@Res() res: Response) {
    return res.sendFile(
      join(
        __dirname,
        '..',
        '..',
        '..',
        'public',
        'html',
        'user',
        'workshopUser.html',
      ),
    );
  }

  @Get('profielAdmin')
  showProfileAdmin(@Res() res: Response) {
    return res.sendFile(
      join(
        __dirname,
        '..',
        '..',
        '..',
        'public',
        'html',
        'admin',
        'gebruikersProfiel.html',
      ),
    );
  }
}
