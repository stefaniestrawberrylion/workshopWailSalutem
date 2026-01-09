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
    const apiKey = this.config.get<string>('SENDGRID_API_KEY');

    if (!from) throw new Error('SENDGRID_FROM_EMAIL is niet ingesteld in .env');
    if (!admin) throw new Error('ADMIN_EMAIL is niet ingesteld in .env');
    if (!apiKey) throw new Error('SENDGRID_API_KEY is niet ingesteld in .env');

    this.fromEmail = from;
    this.adminEmail = admin;

    sgMail.setApiKey(apiKey);
  }
  /* ---------------------------------------------------
   * Algemene e-mail (bijv. reviews met bestaande HTML)
   * --------------------------------------------------- */
  async sendGenericEmail(
    toEmail: string,
    subject: string,
    htmlContent: string,
  ): Promise<void> {
    const html = this.baseTemplate(
      subject,
      htmlContent,
    );

    await this.safeSend({
      to: toEmail,
      from: this.fromEmail,
      subject,
      html,
    });
  }

  /* ---------------------------------------------------
   * Basis e-mail template (professionele layout)
   * --------------------------------------------------- */
  private baseTemplate(title: string, content: string): string {
    return `
      <div style="
        background-color:#f3f4f6;
        padding:40px 0;
        font-family:Arial, Helvetica, sans-serif;
      ">
        <div style="
          max-width:600px;
          margin:0 auto;
          background-color:#1f2933;
          color:#e5e7eb;
          border-radius:8px;
          padding:32px;
        ">
          <h2 style="
            margin-top:0;
            color:#38bdf8;
            font-size:22px;
          ">
            ${title}
          </h2>

          <div style="font-size:15px; line-height:1.6;">
            ${content}
          </div>

          <hr style="
            border:none;
            border-top:1px solid #374151;
            margin:32px 0;
          " />

          <p style="font-size:12px; color:#9ca3af;">
            Dit is een automatisch bericht. Reageren is niet nodig.
          </p>
        </div>
      </div>
    `;
  }

  /* ---------------------------------------------------
   * Admin: nieuw registratieverzoek
   * --------------------------------------------------- */
  async sendAdminNotification(userEmail: string, username: string) {
    const html = this.baseTemplate(
      'Nieuw registratieverzoek',
      `
        <p>Er is een nieuw registratieverzoek ingediend.</p>

        <p>
          <strong>Gebruikersnaam:</strong><br />
          ${username}
        </p>

        <p>
          <strong>E-mailadres:</strong><br />
          <a href="mailto:${userEmail}" style="color:#38bdf8;">
            ${userEmail}
          </a>
        </p>

        <p style="margin-top:24px;">
          <a
            href="https://workshoptest.wailsalutem-foundation.com/dashboard"
            style="
              display:inline-block;
              background-color:#38bdf8;
              color:#0f172a;
              padding:12px 20px;
              border-radius:6px;
              text-decoration:none;
              font-weight:bold;
            "
          >
            Open admin dashboard
          </a>
        </p>
      `,
    );

    await this.safeSend({
      to: this.adminEmail,
      from: this.fromEmail,
      subject: 'Nieuw registratieverzoek',
      html,
    });
  }

  /* ---------------------------------------------------
   * Gebruiker: registratiestatus
   * --------------------------------------------------- */
  async sendUserStatus(userEmail: string, status: 'goedgekeurd' | 'afgewezen') {
    const html = this.baseTemplate(
      'Registratiestatus',
      status === 'goedgekeurd'
        ? `
          <p>Beste gebruiker,</p>
          <p>
            Goed nieuws 🎉 Je registratie is
            <strong>goedgekeurd</strong>.
          </p>
          <p>Je kunt nu inloggen en gebruikmaken van het platform.</p>
        `
        : `
          <p>Beste gebruiker,</p>
          <p>
            Helaas is je registratie
            <strong>afgewezen</strong>.
          </p>
          <p>
            Heb je vragen? Neem dan contact op met de beheerder.
          </p>
        `,
    );

    await this.safeSend({
      to: userEmail,
      from: this.fromEmail,
      subject: 'Registratiestatus',
      html,
    });
  }

  /* ---------------------------------------------------
   * Wachtwoord reset
   * --------------------------------------------------- */
  async sendPasswordResetCode(email: string, name: string, code: string) {
    const html = this.baseTemplate(
      'Wachtwoord reset',
      `
        <p>Hallo <strong>${name}</strong>,</p>

        <p>
          Je hebt een verzoek gedaan om je wachtwoord te resetten.
          Gebruik onderstaande code:
        </p>

        <div style="
          margin:24px 0;
          padding:16px;
          background-color:#111827;
          text-align:center;
          border-radius:6px;
          font-size:24px;
          letter-spacing:4px;
          font-weight:bold;
          color:#38bdf8;
        ">
          ${code}
        </div>

        <p>
          Deze code is <strong>15 minuten geldig</strong>.
          Heb je dit niet aangevraagd, dan kun je deze e-mail negeren.
        </p>
      `,
    );

    await this.safeSend({
      to: email,
      from: this.fromEmail,
      subject: 'Wachtwoord resetten',
      html,
    });
  }

  /* ---------------------------------------------------
   * Admin: account verwijderd
   * --------------------------------------------------- */
  async sendAccountDeletionNotification(userEmail: string, username: string) {
    const html = this.baseTemplate(
      'Account verwijderd',
      `
        <p>Een gebruiker heeft zijn of haar account verwijderd.</p>

        <p>
          <strong>Gebruikersnaam:</strong><br />
          ${username}
        </p>

        <p>
          <strong>E-mailadres:</strong><br />
          <a href="mailto:${userEmail}" style="color:#38bdf8;">
            ${userEmail}
          </a>
        </p>

        <p style="margin-top:24px;">
          <a
            href="https://workshoptest.wailsalutem-foundation.com/dashboard"
            style="
              display:inline-block;
              background-color:#ef4444;
              color:#ffffff;
              padding:12px 20px;
              border-radius:6px;
              text-decoration:none;
              font-weight:bold;
            "
          >
            Open admin dashboard
          </a>
        </p>
      `,
    );

    await this.safeSend({
      to: this.adminEmail,
      from: this.fromEmail,
      subject: 'Gebruiker heeft account verwijderd',
      html,
    });
  }

  /* ---------------------------------------------------
   * Centrale veilige send helper
   * --------------------------------------------------- */
  private async safeSend(msg: sgMail.MailDataRequired) {
    try {
      await sgMail.send(msg);
    } catch (err: any) {
      console.error(
        '[MailService] Fout bij verzenden e-mail:',
        err.response?.body || err,
      );
    }
  }
}
