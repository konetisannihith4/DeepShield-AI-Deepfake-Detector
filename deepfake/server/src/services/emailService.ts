import nodemailer from 'nodemailer';
import { ENV } from '../config/env';

export interface EmailDispatchResult {
  delivered: boolean;
  messageId?: string;
  reason?: string;
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  /**
   * Check if real SMTP provider credentials have been configured
   */
  public static isConfigured(): boolean {
    return Boolean(ENV.SMTP_HOST && ENV.SMTP_USER && ENV.SMTP_PASSWORD);
  }

  /**
   * Get or initialize Nodemailer transporter instance
   */
  private static getTransporter(): nodemailer.Transporter | null {
    if (!this.isConfigured()) {
      return null;
    }

    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: ENV.SMTP_HOST,
        port: ENV.SMTP_PORT,
        secure: ENV.SMTP_SECURE,
        auth: {
          user: ENV.SMTP_USER,
          pass: ENV.SMTP_PASSWORD,
        },
        tls: {
          rejectUnauthorized: ENV.NODE_ENV === 'production',
        },
      });
    }

    return this.transporter;
  }

  /**
   * Send 6-digit OTP verification code via email
   */
  public static async sendOtpEmail(
    to: string,
    fullName: string,
    otp: string,
    purpose: 'SIGNUP' | 'LOGIN' | 'FORGOT_PASSWORD'
  ): Promise<EmailDispatchResult> {
    let subject = 'DeepShield Verification Code';
    let actionTitle = 'Account Verification';

    if (purpose === 'LOGIN') {
      subject = 'DeepShield Login OTP';
      actionTitle = 'Login Authentication';
    } else if (purpose === 'FORGOT_PASSWORD') {
      subject = 'DeepShield Reset Code';
      actionTitle = 'Password Reset Request';
    }

    if (ENV.NODE_ENV !== 'production') {
      console.log(`\n=======================================================`);
      console.log(`📧 [Email Service - ${actionTitle}]`);
      console.log(`Recipient    : ${to} (${fullName || 'User'})`);
      console.log(`Purpose      : ${purpose}`);
      console.log(`🔑 OTP Code   : >>> ${otp} <<<`);
      console.log(`SMTP Ready   : ${this.isConfigured() ? 'YES' : 'NO (Unconfigured in .env)'}`);
      console.log(`=======================================================\n`);
    }

    const transporter = this.getTransporter();

    if (!transporter) {
      return {
        delivered: false,
        reason: 'SMTP_NOT_CONFIGURED',
      };
    }

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #070c1a; color: #f1f5f9; padding: 24px; }
          .card { max-width: 520px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          .logo { font-size: 20px; font-weight: 800; color: #00e6a8; letter-spacing: -0.5px; margin-bottom: 24px; text-transform: uppercase; }
          .title { font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
          .text { font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px; }
          .otp-box { background: #020617; border: 2px dashed #00e6a8; border-radius: 12px; padding: 20px; text-align: center; font-size: 32px; font-weight: 900; letter-spacing: 10px; color: #00e6a8; margin: 24px 0; font-family: monospace; }
          .footer { font-size: 11px; color: #64748b; margin-top: 32px; border-top: 1px solid #1e293b; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">🛡️ TRUEVISION DEEPSHIELD</div>
          <div class="title">${subject}</div>
          <p class="text">
            Hello <strong>${fullName || 'User'}</strong>,<br><br>
            Your DeepShield verification code is:
          </p>
          <div class="otp-box">${otp}</div>
          <p class="text" style="font-size: 13px;">
            This OTP expires in <strong>5 minutes</strong>.<br>
            If you did not request this code, you can safely ignore this email.
          </p>
          <div class="footer">
            Regards,<br>
            <strong>DeepShield Enterprise Security Team</strong><br>
            Automated Identity & Media Forensic Platform
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = `
Hello ${fullName || 'User'},

Your DeepShield verification code is:

${otp}

This OTP expires in 5 minutes.

If you did not request this code, you can safely ignore this email.

Regards,
DeepShield Enterprise Security Team
    `.trim();

    try {
      const info = await transporter.sendMail({
        from: ENV.SMTP_FROM,
        to,
        subject,
        text: textBody,
        html: htmlBody,
      });

      console.log(`[Email Service] OTP email dispatched successfully to ${to}. Message ID: ${info.messageId}`);

      return {
        delivered: true,
        messageId: info.messageId,
      };
    } catch (err: any) {
      console.error(`[Email Service ERROR] Failed to send OTP email to ${to}:`, err.message);
      return {
        delivered: false,
        reason: err.message,
      };
    }
  }
}
