// src/presentation/page.controller.ts
import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { join } from 'path';

@Controller()
export class PageController {
  // --- Publieke loginpagina ---
  @Get('inlog')
  showLogin(@Res() res: Response) {
    return res.sendFile(join(process.cwd(), 'public', 'html', 'inLog.html'));
  }

  // --- ADMIN ROUTES ---
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

  @Get('profieladmin')
  showProfileAdmin(@Res() res: Response) {
    return res.sendFile(
      join(process.cwd(), 'public', 'html', 'admin', 'gebruikersProfiel.html'),
    );
  }

  // --- USER ROUTES ---
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

  // --- NIEUWE PUBLIEKE ROUTES (savePageParents map) ---
  @Get('privacyParents')
  showPrivacyParents(@Res() res: Response) {
    return res.sendFile(
      join(process.cwd(), 'public', 'html', 'savePageParents', 'parentPage.html'),
    );
  }

  @Get('posters')
  showPosters(@Res() res: Response) {
    return res.sendFile(
      join(process.cwd(), 'public', 'html', 'savePageParents', 'posterPage.html'),
    );
  }

  @Get('privacy')
  showPrivacy(@Res() res: Response) {
    return res.sendFile(
      join(process.cwd(), 'public', 'html', 'savePageParents', 'safePage.html'),
    );
  }
}
