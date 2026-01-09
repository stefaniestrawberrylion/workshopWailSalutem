export interface IEmailNotification {
  sendAccountDeletedEmail(email: string): Promise<void>;
  sendPasswordResetCode(
    email: string,
    name: string,
    code: string,
  ): Promise<void>;
  sendUserStatus(
    email: string,
    status: 'goedgekeurd' | 'afgewezen',
  ): Promise<void>;
  sendAdminNotification(email: string, fullName: string): Promise<void>;
}
