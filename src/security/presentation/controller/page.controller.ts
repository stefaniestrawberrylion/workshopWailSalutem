import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { join } from 'path';

@Controller()
export class PageController {
  @Get('inlog')
  showLogin(@Res() res: Response) {
    return res.sendFile(join(process.cwd(), 'public', 'html', 'inLog.html'));
  }

  @Get('toevoegen')
  showWorkshopToevoegen(@Res() res: Response) {
    return res.sendFile(
      join(process.cwd(), 'public', 'html', 'admin', 'workshopToevoegen.html'),
    );
  }

  @Get('dashboard')
  showDashboard(@Res() res: Response) {
    return res.sendFile(
      join(process.cwd(), 'public', 'html', 'admin', 'dashboardAdmin.html'),
    );
  }

  @Get('dashboarduser')
  showDashboardUser(@Res() res: Response) {
    return res.sendFile(
      join(process.cwd(), 'public', 'html', 'user', 'dashboardUser.html'),
    );
  }

  @Get('workshopuser')
  showWorkshopUser(@Res() res: Response) {
    return res.sendFile(
      join(process.cwd(), 'public', 'html', 'user', 'workshopUser.html'),
    );
  }

  @Get('profieladmin')
  showProfileAdmin(@Res() res: Response) {
    return res.sendFile(
      join(process.cwd(), 'public', 'html', 'admin', 'gebruikersProfiel.html'),
    );
  }
}
