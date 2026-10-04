import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { prisma } from '../config/database';
import puppeteer from 'puppeteer-core';

type AgreementRole = 'TENANT' | 'OWNER';

interface AgreementSignature {
  userId: number;
  name: string;
  email: string;
  role: AgreementRole;
  walletAddress: string | null;
  signedAt: string;
  signatureHash: string;
  ipAddress?: string;
}

interface StoredAgreement {
  bookingId: number;
  tenantSignature?: AgreementSignature;
  ownerSignature?: AgreementSignature;
  updatedAt: string;
}

interface AgreementStore {
  agreements: Record<string, StoredAgreement>;
}

interface AuthUser {
  id: number;
  email: string;
  role: string;
  walletAddress: string | null;
}

const storePath = path.resolve(process.cwd(), 'data', 'booking-agreements.json');

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export class AgreementService {
  private static async readStore(): Promise<AgreementStore> {
    try {
      const raw = await fs.readFile(storePath, 'utf8');
      return JSON.parse(raw) as AgreementStore;
    } catch {
      return { agreements: {} };
    }
  }

  private static async writeStore(store: AgreementStore): Promise<void> {
    await fs.mkdir(path.dirname(storePath), { recursive: true });
    await fs.writeFile(storePath, JSON.stringify(store, null, 2), 'utf8');
  }

  private static async getBookingForAgreement(bookingId: number, user: AuthUser) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        tenant: { select: { id: true, name: true, email: true, walletAddress: true } },
        property: {
          include: {
            owner: { select: { id: true, name: true, email: true, walletAddress: true } },
          },
        },
        transactions: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!booking) throw new Error('Booking not found');

    const isTenant = booking.tenantId === user.id;
    const isOwner = booking.property.ownerId === user.id;
    const isAdmin = user.role === 'ADMIN';
    if (!isTenant && !isOwner && !isAdmin) {
      throw new Error('Not authorized to access this agreement');
    }

    return booking;
  }

  private static roleForBooking(booking: Awaited<ReturnType<typeof AgreementService.getBookingForAgreement>>, userId: number): AgreementRole {
    if (booking.tenantId === userId) return 'TENANT';
    if (booking.property.ownerId === userId) return 'OWNER';
    throw new Error('Only the tenant or owner can sign this agreement');
  }

  static async getAgreement(bookingId: number, user: AuthUser) {
    const booking = await this.getBookingForAgreement(bookingId, user);
    const store = await this.readStore();
    const stored = store.agreements[String(bookingId)] || {
      bookingId,
      updatedAt: new Date().toISOString(),
    };

    return {
      booking,
      agreement: {
        ...stored,
        tenantSigned: Boolean(stored.tenantSignature),
        ownerSigned: Boolean(stored.ownerSignature),
        fullySigned: Boolean(stored.tenantSignature && stored.ownerSignature),
      },
    };
  }

  static async signAgreement(bookingId: number, user: AuthUser, ipAddress?: string) {
    const booking = await this.getBookingForAgreement(bookingId, user);
    const role = this.roleForBooking(booking, user.id);

    if (['REJECTED', 'CANCELLED', 'REFUNDED', 'DISPUTED'].includes(booking.status)) {
      throw new Error(`Cannot sign agreement while booking is ${booking.status}`);
    }

    const signer = role === 'TENANT' ? booking.tenant : booking.property.owner;
    const signedAt = new Date().toISOString();
    const signaturePayload = [
      bookingId,
      role,
      signer.id,
      signer.email,
      signer.walletAddress || '',
      booking.txHash || '',
      booking.blockchainBookingId || '',
      signedAt,
    ].join('|');

    const signature: AgreementSignature = {
      userId: signer.id,
      name: signer.name,
      email: signer.email,
      role,
      walletAddress: signer.walletAddress,
      signedAt,
      signatureHash: crypto.createHash('sha256').update(signaturePayload).digest('hex'),
      ipAddress,
    };

    const store = await this.readStore();
    const existing = store.agreements[String(bookingId)] || {
      bookingId,
      updatedAt: signedAt,
    };

    if (role === 'TENANT') existing.tenantSignature = signature;
    if (role === 'OWNER') existing.ownerSignature = signature;
    existing.updatedAt = signedAt;

    store.agreements[String(bookingId)] = existing;
    await this.writeStore(store);

    return this.getAgreement(bookingId, user);
  }

  static async renderAgreementPdf(bookingId: number, user: AuthUser): Promise<Buffer> {
    const html = await this.renderAgreementHtml(bookingId, user);

    const chromePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      process.env.CHROME_PATH || '',
    ].filter(Boolean);

    let browser;
    for (const exePath of chromePaths) {
      try {
        browser = await puppeteer.launch({
          executablePath: exePath,
          args: ['--no-sandbox', '--headless=new', '--disable-gpu'],
        });
        break;
      } catch { continue; }
    }

    if (!browser) {
      throw new Error('No compatible browser found for PDF generation. Install Chrome or set CHROME_PATH.');
    }

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' as const });
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } });
      await browser.close();
      return Buffer.from(pdfBuffer);
    } catch (err) {
      if (browser) await browser.close();
      throw err;
    }
  }

  static async renderAgreementHtml(bookingId: number, user: AuthUser): Promise<string> {
    const { booking, agreement } = await this.getAgreement(bookingId, user);
    const property = booking.property;
    const owner = property.owner;
    const tenant = booking.tenant;
    const transactions = booking.transactions || [];

    const signatureRows = [
      agreement.tenantSignature,
      agreement.ownerSignature,
    ].map((sig) => {
      if (!sig) {
        return '<tr><td colspan="5" class="muted">Signature pending</td></tr>';
      }
      return `<tr>
        <td>${escapeHtml(sig.role)}</td>
        <td>${escapeHtml(sig.name)}<br><span class="muted">${escapeHtml(sig.email)}</span></td>
        <td>${escapeHtml(sig.walletAddress || 'No wallet linked')}</td>
        <td>${escapeHtml(formatDate(sig.signedAt))}</td>
        <td class="hash">${escapeHtml(sig.signatureHash)}</td>
      </tr>`;
    }).join('');

    const transactionRows = transactions.length
      ? transactions.map((tx) => `<tr>
          <td>${escapeHtml(tx.type)}</td>
          <td>${escapeHtml(tx.amount)} ETH</td>
          <td>${escapeHtml(tx.fromAddress)}</td>
          <td>${escapeHtml(tx.toAddress)}</td>
          <td class="hash">${escapeHtml(tx.txHash)}</td>
          <td>${escapeHtml(tx.status)}</td>
        </tr>`).join('')
      : '<tr><td colspan="6" class="muted">No blockchain transactions recorded yet.</td></tr>';

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Booking Agreement #${escapeHtml(booking.id)}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; margin: 40px; line-height: 1.5; }
    h1 { margin-bottom: 4px; }
    h2 { margin-top: 28px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; vertical-align: top; font-size: 13px; }
    th { background: #f9fafb; }
    .muted { color: #6b7280; font-size: 12px; }
    .hash { font-family: Consolas, monospace; font-size: 11px; word-break: break-all; }
    .status { display: inline-block; padding: 4px 8px; border-radius: 6px; background: #ecfdf5; color: #047857; font-weight: 700; }
  </style>
</head>
<body>
  <h1>Kigali Real Estate Booking Agreement</h1>
  <div class="muted">Generated ${escapeHtml(formatDate(new Date()))}</div>
  <p class="status">${agreement.fullySigned ? 'Fully signed by tenant and owner' : 'Awaiting one or more signatures'}</p>

  <h2>Booking Details</h2>
  <table>
    <tr><th>Booking ID</th><td>${escapeHtml(booking.id)}</td></tr>
    <tr><th>Status</th><td>${escapeHtml(booking.status)}</td></tr>
    <tr><th>Property</th><td>${escapeHtml(property.title)}<br><span class="muted">${escapeHtml(property.location)}, ${escapeHtml(property.district)}</span></td></tr>
    <tr><th>Dates</th><td>${escapeHtml(formatDate(booking.startDate))} to ${escapeHtml(formatDate(booking.endDate))}</td></tr>
    <tr><th>Deposit / Escrow</th><td>${escapeHtml(booking.escrowAmount || property.depositEth)} ETH</td></tr>
    <tr><th>Total Amount</th><td>${escapeHtml(booking.totalAmount || 'N/A')} ETH</td></tr>
    <tr><th>Remaining Amount</th><td>${escapeHtml(booking.remainingAmount || 'N/A')} ETH</td></tr>
  </table>

  <h2>Parties</h2>
  <table>
    <tr><th>Role</th><th>Name</th><th>Email</th><th>Wallet</th></tr>
    <tr><td>Tenant</td><td>${escapeHtml(tenant.name)}</td><td>${escapeHtml(tenant.email)}</td><td class="hash">${escapeHtml(tenant.walletAddress || 'No wallet linked')}</td></tr>
    <tr><td>Owner</td><td>${escapeHtml(owner.name)}</td><td>${escapeHtml(owner.email)}</td><td class="hash">${escapeHtml(owner.walletAddress || 'No wallet linked')}</td></tr>
  </table>

  <h2>Blockchain Details</h2>
  <table>
    <tr><th>Contract Booking ID</th><td>${escapeHtml(booking.blockchainBookingId || 'Not recorded')}</td></tr>
    <tr><th>Main Transaction Hash</th><td class="hash">${escapeHtml(booking.txHash || 'Not recorded')}</td></tr>
    <tr><th>Payment Method</th><td>${escapeHtml(booking.paymentMethod || 'Not recorded')}</td></tr>
    <tr><th>Payment Status</th><td>${escapeHtml(booking.paymentStatus || 'PENDING')}</td></tr>
  </table>

  <h2>Transaction History</h2>
  <table>
    <tr><th>Type</th><th>Amount</th><th>From Wallet</th><th>To Wallet</th><th>Transaction Hash</th><th>Status</th></tr>
    ${transactionRows}
  </table>

  <h2>Digital Signatures</h2>
  <table>
    <tr><th>Role</th><th>Signer</th><th>Wallet</th><th>Signed At</th><th>Signature Hash</th></tr>
    ${signatureRows}
  </table>
</body>
</html>`;
  }
}
