import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../src/mail/application/mail.service';

// --------------------------------------
// JUISTE, VEILIGE SENDGRID MOCK
// --------------------------------------
const sendGridMock = {
  setApiKey: jest.fn(),
  send: jest.fn(),
};

jest.mock('@sendgrid/mail', () => ({
  __esModule: true,
  default: {
    setApiKey: (...args: unknown[]): void => {
      sendGridMock.setApiKey(...args);
    },
    send: (...args: unknown[]): Promise<void> => {
      sendGridMock.send(...args);
      return Promise.resolve();
    },
  },
}));

// --------------------------------------
// TESTS
// --------------------------------------
describe('MailService', () => {
  let service: MailService;
  let configService: ConfigService;

  const mockConfig: Record<string, string | undefined> = {
    SENDGRID_FROM_EMAIL: 'noreply@mijnapp.nl',
    ADMIN_EMAIL: 'admin@mijnapp.nl',
    SENDGRID_API_KEY: 'test_api_key',
  };

  beforeEach(async () => {
    sendGridMock.setApiKey.mockClear();
    sendGridMock.send.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string): string | undefined => mockConfig[key],
          },
        },
      ],
    }).compile();

    service = module.get(MailService);
    configService = module.get(ConfigService);
  });

  // ------------------------------
  // INITIALISATIE
  // ------------------------------
  describe('Initialisatie', () => {
    it('zou moeten initialiseren', () => {
      expect(service).toBeDefined();
    });

    it('zou SendGrid setApiKey moeten aanroepen', () => {
      expect(sendGridMock.setApiKey).toHaveBeenCalledTimes(1);
      expect(sendGridMock.setApiKey).toHaveBeenCalledWith('test_api_key');
    });

    it('zou fout gooien bij ontbrekende FROM email', async () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'SENDGRID_FROM_EMAIL') return undefined;
        return mockConfig[key];
      });

      await expect(
        Test.createTestingModule({
          providers: [
            MailService,
            { provide: ConfigService, useValue: configService },
          ],
        }).compile(),
      ).rejects.toThrow('SENDGRID_FROM_EMAIL is niet ingesteld in .env');
    });
  });

  // ------------------------------
  // sendAdminNotification
  // ------------------------------
  describe('sendAdminNotification', () => {
    const user = { email: 'test@user.nl', name: 'Jan' };

    it('verstuurd admin notificatie', async () => {
      await service.sendAdminNotification(user.email, user.name);

      expect(sendGridMock.send).toHaveBeenCalledTimes(1);
      const msg = sendGridMock.send.mock.calls[0][0] as Record<string, unknown>;

      expect(msg.to).toBe(mockConfig.ADMIN_EMAIL);
      expect(msg.from).toBe(mockConfig.SENDGRID_FROM_EMAIL);
      expect(msg.html as string).toContain(user.name);
    });
  });

  // ------------------------------
  // sendUserStatus
  // ------------------------------
  describe('sendUserStatus', () => {
    const email = 'user@mail.nl';

    it('verstuurd goedgekeurd mail', async () => {
      await service.sendUserStatus(email, 'goedgekeurd');

      expect(sendGridMock.send).toHaveBeenCalledTimes(1);
      const msg = sendGridMock.send.mock.calls[0][0] as Record<string, unknown>;

      expect(msg.to).toBe(email);
      expect(msg.html as string).toContain('goedgekeurd');
    });

    it('verstuurd afgewezen mail', async () => {
      await service.sendUserStatus(email, 'afgewezen');

      expect(sendGridMock.send).toHaveBeenCalledTimes(1);
      const msg = sendGridMock.send.mock.calls[0][0] as Record<string, unknown>;

      expect(msg.to).toBe(email);
      expect(msg.html as string).toContain('afgewezen');
    });
  });
});
