import nodemailer from 'nodemailer';
import { env } from '../config/env';

// Email transporter
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

// Verify SMTP on startup
transporter.verify().then(() => {
  console.log('✓ SMTP connected (' + env.SMTP_USER + ')');
}).catch((e: Error) => {
  console.warn('⚠ SMTP not configured: ' + e.message);
  console.warn('  → Email notifications will fail silently');
  console.warn('  → For Gmail, use an App Password (requires 2FA):');
  console.warn('    https://myaccount.google.com/apppasswords');
});

export class EmailService {
  static async sendEmail(to: string, subject: string, html: string) {
    try {
      await transporter.sendMail({
        from: `"Kigali Real Estate" <${env.SMTP_FROM_EMAIL}>`,
        to,
        subject,
        html,
      });
      console.log(`Email sent to ${to}`);
    } catch (error) {
      console.error('Email send failed:', error);
      throw error;
    }
  }

  static async sendBookingConfirmation(
    to: string,
    booking: {
      id: number;
      propertyTitle: string;
      startDate: string;
      endDate: string;
      amount: string;
    }
  ) {
    const html = `
      <h1>Booking Confirmed! 🎉</h1>
      <p>Your booking has been confirmed successfully.</p>
      <h2>Booking Details:</h2>
      <ul>
        <li><strong>Property:</strong> ${booking.propertyTitle}</li>
        <li><strong>Booking ID:</strong> #${booking.id}</li>
        <li><strong>Check-in:</strong> ${booking.startDate}</li>
        <li><strong>Check-out:</strong> ${booking.endDate}</li>
        <li><strong>Amount:</strong> ${booking.amount} ETH</li>
      </ul>
      <p>You can view your booking details in your dashboard.</p>
      <hr>
      <p style="color: #666; font-size: 12px;">Kigali Real Estate - Secure Property Booking</p>
    `;

    await this.sendEmail(to, 'Booking Confirmed - Kigali Real Estate', html);
  }

  static async sendPaymentReceipt(
    to: string,
    payment: {
      amount: number;
      currency: string;
      method: string;
      transactionId: string;
    }
  ) {
    const html = `
      <h1>Payment Receipt 💰</h1>
      <p>Your payment has been processed successfully.</p>
      <h2>Payment Details:</h2>
      <ul>
        <li><strong>Amount:</strong> ${payment.amount} ${payment.currency}</li>
        <li><strong>Payment Method:</strong> ${payment.method}</li>
        <li><strong>Transaction ID:</strong> ${payment.transactionId}</li>
      </ul>
      <p>Thank you for your payment!</p>
      <hr>
      <p style="color: #666; font-size: 12px;">Kigali Real Estate</p>
    `;

    await this.sendEmail(to, 'Payment Receipt - Kigali Real Estate', html);
  }

  static async sendKYCStatus(
    to: string,
    status: 'APPROVED' | 'REJECTED',
    reason?: string
  ) {
    const isApproved = status === 'APPROVED';
    const html = `
      <h1>${isApproved ? '✅ KYC Approved!' : '❌ KYC Review Update'}</h1>
      <p>Your identity verification has been ${status.toLowerCase()}.</p>
      ${!isApproved && reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      ${!isApproved ? '<p>You can resubmit your documents with the corrections mentioned above.</p>' : '<p>You now have full access to all platform features.</p>'}
      <hr>
      <p style="color: #666; font-size: 12px;">Kigali Real Estate</p>
    `;

    await this.sendEmail(
      to,
      `KYC Verification ${status} - Kigali Real Estate`,
      html
    );
  }

  static async sendPasswordReset(to: string, resetToken: string) {
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const html = `
      <h1>Password Reset Request</h1>
      <p>You requested to reset your password.</p>
      <p><a href="${resetUrl}" style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <hr>
      <p style="color: #666; font-size: 12px;">Kigali Real Estate</p>
    `;

    await this.sendEmail(to, 'Password Reset - Kigali Real Estate', html);
  }

  static async sendNewBookingToOwner(
    to: string,
    ownerName: string,
    booking: {
      id: number;
      tenantName: string;
      tenantEmail: string;
      propertyTitle: string;
      startDate: string;
      endDate: string;
    }
  ) {
    const html = `
      <h1>New Booking Request 🏠</h1>
      <p>Hi ${ownerName},</p>
      <p>You have received a new booking request for your property.</p>
      <h2>Booking Details:</h2>
      <ul>
        <li><strong>Property:</strong> ${booking.propertyTitle}</li>
        <li><strong>Booking ID:</strong> #${booking.id}</li>
        <li><strong>Tenant:</strong> ${booking.tenantName} (${booking.tenantEmail})</li>
        <li><strong>Check-in:</strong> ${booking.startDate}</li>
        <li><strong>Check-out:</strong> ${booking.endDate}</li>
      </ul>
      <p>Please review and accept or reject this request in your dashboard.</p>
      <p><a href="${env.FRONTEND_URL}/bookings/${booking.id}" style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Booking</a></p>
      <hr>
      <p style="color: #666; font-size: 12px;">Kigali Real Estate - Secure Property Booking</p>
    `;

    await this.sendEmail(to, 'New Booking Request - Kigali Real Estate', html);
  }

  static async sendBookingAcceptedToTenant(
    to: string,
    tenantName: string,
    booking: {
      id: number;
      propertyTitle: string;
      startDate: string;
      endDate: string;
      depositEth: string;
    }
  ) {
    const html = `
      <h1>Booking Accepted ✅</h1>
      <p>Hi ${tenantName},</p>
      <p>Your booking request has been accepted by the property owner!</p>
      <h2>Booking Details:</h2>
      <ul>
        <li><strong>Property:</strong> ${booking.propertyTitle}</li>
        <li><strong>Booking ID:</strong> #${booking.id}</li>
        <li><strong>Check-in:</strong> ${booking.startDate}</li>
        <li><strong>Check-out:</strong> ${booking.endDate}</li>
        <li><strong>Deposit Required:</strong> ${booking.depositEth} ETH</li>
      </ul>
      <p>To secure your booking, please make the deposit via the platform.</p>
      <p><a href="${env.FRONTEND_URL}/bookings/${booking.id}" style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Make Deposit</a></p>
      <hr>
      <p style="color: #666; font-size: 12px;">Kigali Real Estate - Secure Property Booking</p>
    `;

    await this.sendEmail(to, 'Booking Accepted - Kigali Real Estate', html);
  }

  static async sendWelcomeEmail(to: string, name: string) {
    const html = `
      <h1>Welcome to Kigali Real Estate! 🏠</h1>
      <p>Hi ${name},</p>
      <p>Welcome to our platform! We're excited to have you on board.</p>
      <h2>What you can do:</h2>
      <ul>
        <li>🔍 Browse premium properties in Kigali</li>
        <li>💳 Book with secure blockchain escrow</li>
        <li>💰 Pay with MoMo, cards, or cryptocurrency</li>
        <li>⭐ Leave reviews and build trust</li>
        <li>📱 Manage everything from your dashboard</li>
      </ul>
      <p>Get started by exploring our available properties!</p>
      <hr>
      <p style="color: #666; font-size: 12px;">Kigali Real Estate Team</p>
    `;

    await this.sendEmail(to, 'Welcome to Kigali Real Estate!', html);
  }
}
