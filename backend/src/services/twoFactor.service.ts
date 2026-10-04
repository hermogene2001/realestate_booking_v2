import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { prisma } from '../config/database';
import crypto from 'crypto';

export class TwoFactorService {
  static async setup2FA(userId: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    if (user.twoFactorEnabled) {
      throw new Error('2FA is already enabled');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Kigali Real Estate (${user.email})`,
      issuer: 'Kigali Real Estate',
      length: 32,
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes(10);

    // Temporarily store secret (will be confirmed in verify step)
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret.base32,
        backupCodes: JSON.stringify(backupCodes.map(code => this.hashBackupCode(code))),
      },
    });

    return {
      secret: secret.base32,
      qrCodeUrl,
      backupCodes, // Only shown once during setup
    };
  }

  static async verify2FASetup(userId: number, token: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    if (!user.twoFactorSecret) throw new Error('2FA not initiated');
    if (user.twoFactorEnabled) throw new Error('2FA already enabled');

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) {
      throw new Error('Invalid verification code');
    }

    // Enable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
      },
    });

    return { message: '2FA enabled successfully' };
  }

  static async verify2FAToken(userId: number, token: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    if (!user.twoFactorEnabled) return true; // 2FA not enabled

    // Check if it's a backup code
    if (await this.verifyBackupCode(user, token)) {
      return true;
    }

    // Verify TOTP
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret!,
      encoding: 'base32',
      token,
      window: 1,
    });

    return verified;
  }

  static async disable2FA(userId: number, token: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    if (!user.twoFactorEnabled) throw new Error('2FA is not enabled');

    // Verify token before disabling
    const verified = await this.verify2FAToken(userId, token);
    if (!verified) {
      throw new Error('Invalid verification code');
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: null as any,
      },
    });

    return { message: '2FA disabled successfully' };
  }

  static async regenerateBackupCodes(userId: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    if (!user.twoFactorEnabled) throw new Error('2FA not enabled');

    const backupCodes = this.generateBackupCodes(10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        backupCodes: JSON.stringify(backupCodes.map(code => this.hashBackupCode(code))),
      },
    });

    return { backupCodes };
  }

  private static generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  private static hashBackupCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  private static async verifyBackupCode(user: any, code: string): Promise<boolean> {
    if (!user.backupCodes) return false;

    const hashedCodes: string[] = JSON.parse(user.backupCodes);
    const hashedInput = this.hashBackupCode(code);

    const index = hashedCodes.findIndex(hc => hc === hashedInput);
    if (index === -1) return false;

    // Remove used backup code
    hashedCodes.splice(index, 1);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        backupCodes: JSON.stringify(hashedCodes),
      },
    });

    return true;
  }
}
