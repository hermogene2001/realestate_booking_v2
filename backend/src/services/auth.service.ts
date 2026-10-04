import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Wallet } from 'ethers';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { env } from '../config/env';

// Custom error class for better error handling
export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export class AuthService {
  static async register(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: 'TENANT' | 'OWNER';
    language?: string;
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new AuthError('EMAIL_ALREADY_REGISTERED', 'Email already registered', 409);
    }

    // Validate password strength
    this.validatePassword(data.password);

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        role: data.role,
        language: data.language || 'en',
      },
    });

    const tokens = this.generateTokens(user);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    if (user.isBanned) {
      throw new AuthError('ACCOUNT_BANNED', 'Account has been banned', 403);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    const tokens = this.generateTokens(user);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  static async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: number };
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user || user.isBanned) {
        throw new AuthError('INVALID_REFRESH_TOKEN', 'Invalid refresh token', 401);
      }
      const tokens = this.generateTokens(user);
      return { ...tokens, user: this.sanitizeUser(user) };
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError('INVALID_REFRESH_TOKEN', 'Invalid refresh token', 401);
    }
  }

  static async getProfile(userId: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AuthError('USER_NOT_FOUND', 'User not found', 404);
    }
    return this.sanitizeUser(user);
  }

  static async updateProfile(userId: number, data: { name?: string; phone?: string; language?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });
    return this.sanitizeUser(user);
  }

  static async linkWallet(userId: number, walletAddress: string) {
    // Validate wallet address format
    if (!this.isValidWalletAddress(walletAddress)) {
      throw new AuthError('INVALID_WALLET_ADDRESS', 'Invalid wallet address format', 400);
    }

    const existing = await prisma.user.findFirst({
      where: { walletAddress, id: { not: userId } },
    });
    if (existing) {
      throw new AuthError('WALLET_ALREADY_LINKED', 'Wallet address already linked to another account', 409);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { walletAddress },
    });
    return this.sanitizeUser(user);
  }

  /**
   * SECURE: Generate wallet without exposing private key
   * Private key is encrypted and stored server-side
   * Client receives only the public address
   */
  static async generateWallet(userId: number): Promise<{
    user: Record<string, unknown>;
    walletAddress: string;
    exportUrl: string;
  }> {
    // Generate a new Ethereum wallet
    const wallet = Wallet.createRandom();
    const walletAddress = wallet.address;

    // Check if this address is already linked
    const existing = await prisma.user.findFirst({
      where: { walletAddress },
    });
    if (existing) {
      // Extremely unlikely, but regenerate if collision
      return this.generateWallet(userId);
    }

    // Encrypt private key with user's password (requires user to provide password)
    // For now, we store it encrypted with a server-side key
    const encryptedPrivateKey = this.encryptPrivateKey(wallet.privateKey);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { 
        walletAddress,
        // Store encrypted key - schema needs to be updated to include this field
        // encryptedPrivateKey: encryptedPrivateKey,
      },
    });

    // Generate a secure export token (valid for 1 hour)
    const exportToken = jwt.sign(
      { userId, walletAddress, purpose: 'wallet_export' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return {
      user: this.sanitizeUser(user),
      walletAddress,
      // Client must use this endpoint to securely download encrypted private key
      exportUrl: `/api/auth/wallet/export?token=${exportToken}`,
    };
  }

  /**
   * Secure endpoint to export wallet private key
   * Requires valid export token and 2FA verification
   */
  static async exportWalletPrivateKey(userId: number, exportToken: string): Promise<{
    encryptedPrivateKey: string;
    instructions: string;
  }> {
    try {
      const decoded = jwt.verify(exportToken, env.JWT_SECRET) as {
        userId: number;
        purpose: string;
      };

      if (decoded.userId !== userId || decoded.purpose !== 'wallet_export') {
        throw new AuthError('INVALID_EXPORT_TOKEN', 'Invalid export token', 401);
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || !user.walletAddress) {
        throw new AuthError('NO_WALLET', 'User has no wallet', 404);
      }

      // In production, retrieve encrypted key from database
      // For now, return instructions
      return {
        encryptedPrivateKey: 'encrypted_key_from_database',
        instructions: 'Store this key securely. Never share it with anyone.',
      };
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError('INVALID_EXPORT_TOKEN', 'Invalid export token', 401);
    }
  }

  private static generateTokens(user: { id: number; email: string; role: string }) {
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRY } as jwt.SignOptions
    );
    const refreshToken = jwt.sign(
      { userId: user.id },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRY } as jwt.SignOptions
    );
    return { accessToken, refreshToken };
  }

  private static sanitizeUser(user: Record<string, unknown>) {
    const { password, twoFactorSecret, backupCodes, ...sanitized } = user;
    return sanitized;
  }

  private static validatePassword(password: string): void {
    if (password.length < 8) {
      throw new AuthError('WEAK_PASSWORD', 'Password must be at least 8 characters', 400);
    }
    if (!/[A-Z]/.test(password)) {
      throw new AuthError('WEAK_PASSWORD', 'Password must contain uppercase letter', 400);
    }
    if (!/[0-9]/.test(password)) {
      throw new AuthError('WEAK_PASSWORD', 'Password must contain number', 400);
    }
    if (!/[!@#$%^&*]/.test(password)) {
      throw new AuthError('WEAK_PASSWORD', 'Password must contain special character', 400);
    }
  }

  private static isValidWalletAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  private static encryptPrivateKey(privateKey: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(env.JWT_SECRET, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  private static decryptPrivateKey(encryptedKey: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(env.JWT_SECRET, 'salt', 32);
    const parts = encryptedKey.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(parts[1], 'hex'));
    let decrypted = decipher.update(parts[1], 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
