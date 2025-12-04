import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';

@Injectable()
export class MailService {
  private readonly fromEmail: string;
  private readonly adminEmail: string;

  constructor(private readonly config: ConfigService) {
    const from = this.config.get<string>('SENDGRID_FROM_EMAIL');
    const admin = this.config.get<string>('ADMIN_EMAIL');

    if (!from) {
      throw new Error('SENDGRID_FROM_EMAIL is niet ingesteld in .env');
    }
    if (!admin) {
      throw new Error('ADMIN_EMAIL is niet ingesteld in .env');
    }

    this.fromEmail = from;
    this.adminEmail = admin;

    sgMail.setApiKey(this.config.get<string>('SENDGRID_API_KEY')!);
  }

  async sendAdminNotification(userEmail: string, username: string) {
    const msg = {
      to: this.adminEmail,
      from: this.fromEmail,
      subject: 'Nieuw registratieverzoek',
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
          <h2 style="color: #0070f3;">Nieuw registratieverzoek</h2>
          <p>Gebruiker <b>${username}</b> wil zich registreren met e-mail: <a href="mailto:${userEmail}">${userEmail}</a></p>
          <p style="margin-top: 20px;">Bezoek <a href="https://workshoptest.wailsalutem-foundation.com/dashboard">admin dashboard</a> om dit verzoek te bekijken.</p>
        </div>
      `,
    };
    try {
      await sgMail.send(msg);
    } catch (err: any) {
      console.error(
        '[MailService] Fout bij verzenden admin e-mail:',
        err.response?.body || err,
      );
    }
  }

  async sendUserStatus(userEmail: string, status: 'goedgekeurd' | 'afgewezen') {
    const htmlContent =
      status === 'goedgekeurd'
        ? 'Je registratie is goedgekeurd! Je kunt nu inloggen.'
        : 'Helaas is je registratie afgewezen.';

    const msg = {
      to: userEmail,
      from: this.fromEmail,
      subject: 'Registratiestatus',
      html: `<p>${htmlContent}</p>`,
    };

    try {
      await sgMail.send(msg);
    } catch (err: any) {
      console.error(
        '[MailService] Fout bij verzenden e-mail status:',
        err.response?.body || err,
      );
    }
  }
  async sendGenericEmail(
    toEmail: string,
    subject: string,
    htmlContent: string,
  ): Promise<void> {
    const msg = {
      to: toEmail,
      from: this.fromEmail,
      subject: subject,
      html: htmlContent,
    };

    try {
      await sgMail.send(msg);
    } catch (err: any) {
      console.error(
        '[MailService] Fout bij verzenden algemene e-mail:',
        err.response?.body || err,
      );
      throw new Error('Fout bij verzenden e-mail.');
    }
  }
}
