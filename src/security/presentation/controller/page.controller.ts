// src/presentation/page.controller.ts
import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { join } from 'path';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../guards/role.guard';
import { Roles } from '../auth/role.decorator';
import { Role } from '../../domain/enums/role.enum';

@Controller()
export class PageController {
  // Publieke loginpagina
  @Get('inlog')
  showLogin(@Res() res: Response) {
    return res.sendFile(join(process.cwd(), 'public', 'html', 'inLog.html'));
  }

  // --- ADMIN ROUTES ---
  @Get('toevoegen')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  showWorkshopToevoegen(@Res() res: Response) {
    return res.sendFile(
      join(process.cwd(), 'public', 'html', 'admin', 'workshopToevoegen.html'),
    );
  }

  @Get('dashboard')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  showDashboard(@Res() res: Response) {
    try {
      return res.sendFile(
        join(process.cwd(), 'public', 'html', 'admin', 'dashboardAdmin.html'),
      );
    } catch {
      return res.redirect('/inlog');
    }
  }
  @Get('profieladmin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  showProfileAdmin(@Res() res: Response) {
    return res.sendFile(
      join(process.cwd(), 'public', 'html', 'admin', 'gebruikersProfiel.html'),
    );
  }

  // --- USER ROUTES ---
  @Get('dashboarduser')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.USER)
  showDashboardUser(@Res() res: Response) {
    return res.sendFile(
      join(process.cwd(), 'public', 'html', 'user', 'dashboardUser.html'),
    );
  }

  @Get('workshopuser')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.USER)
  showWorkshopUser(@Res() res: Response) {
    return res.sendFile(
      join(process.cwd(), 'public', 'html', 'user', 'workshopUser.html'),
    );
  }
}
