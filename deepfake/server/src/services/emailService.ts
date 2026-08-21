import nodemailer from 'nodemailer';
import { ENV } from '../config/env';

export interface EmailDispatchResult {
  delivered: boolean;
  messageId?: string;
  reason?: string;
  previewUrl?: string;
  actionUrl?: string;
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
   * Dispatch account email verification link
   */
  public static async sendVerificationEmail(
    to: string,
    fullName: string,
    token: string
  ): Promise<EmailDispatchResult> {
    const verificationUrl = `${ENV.CLIENT_URL}/verify-email?token=${token}`;

    console.log(`\n=======================================================`);
    console.log(`📧 [Email Service - Account Verification]`);
    console.log(`Recipient    : ${to} (${fullName})`);
    console.log(`Verify Link  : ${verificationUrl}`);
    console.log(`SMTP Ready   : ${this.isConfigured() ? 'YES' : 'NO (Unconfigured in .env)'}`);
    console.log(`=======================================================\n`);

    const transporter = this.getTransporter();

    if (!transporter) {
      return {
        delivered: false,
        reason: 'SMTP_NOT_CONFIGURED',
        actionUrl: verificationUrl,
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
          .btn { display: inline-block; background-color: #00e6a8; color: #070c1a; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
          .footer { font-size: 11px; color: #64748b; margin-top: 32px; border-top: 1px solid #1e293b; pt-4; }
          .raw-link { word-break: break-all; color: #38bdf8; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">🛡️ TRUEVISION DEEPSHIELD</div>
          <div class="title">Verify your DeepShield account</div>
          <p class="text">
            Hello <strong>${fullName}</strong>,<br><br>
            Welcome to DeepShield Enterprise. Your account has been created successfully.<br><br>
            Please verify your email address using the button below to activate your console access:
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${verificationUrl}" class="btn" target="_blank">Verify Email</a>
          </div>
          <p class="text">
            Or copy and paste this verification URL into your browser:<br>
            <a href="${verificationUrl}" class="raw-link">${verificationUrl}</a>
          </p>
          <p class="text" style="font-size: 12px;">
            This verification link will expire in 24 hours.<br>
            If you did not create this account, you can safely ignore this email.
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
Hello ${fullName},

Welcome to DeepShield Enterprise.

Your account has been created successfully.
Please verify your email address to activate your console access using the link below:

${verificationUrl}

This verification link will expire in 24 hours.
If you did not create this account, you can safely ignore this email.

Regards,
DeepShield Enterprise Security Team
    `.trim();

    try {
      const info = await transporter.sendMail({
        from: ENV.SMTP_FROM,
        to,
        subject: 'Verify your DeepShield account',
        text: textBody,
        html: htmlBody,
      });

      console.log(`[Email Service] Verification email dispatched successfully. ID: ${info.messageId}`);

      return {
        delivered: true,
        messageId: info.messageId,
        actionUrl: verificationUrl,
      };
    } catch (err: any) {
      console.error(`[Email Service ERROR] Failed to send verification email:`, err.message);
      return {
        delivered: false,
        reason: err.message,
        actionUrl: verificationUrl,
      };
    }
  }

  /**
   * Dispatch password reset link
   */
  public static async sendPasswordResetEmail(
    to: string,
    fullName: string,
    token: string
  ): Promise<EmailDispatchResult> {
    const resetUrl = `${ENV.CLIENT_URL}/reset-password?token=${token}`;

    console.log(`\n=======================================================`);
    console.log(`🔑 [Email Service - Password Reset]`);
    console.log(`Recipient    : ${to} (${fullName})`);
    console.log(`Reset Link   : ${resetUrl}`);
    console.log(`SMTP Ready   : ${this.isConfigured() ? 'YES' : 'NO (Unconfigured in .env)'}`);
    console.log(`=======================================================\n`);

    const transporter = this.getTransporter();

    if (!transporter) {
      return {
        delivered: false,
        reason: 'SMTP_NOT_CONFIGURED',
        actionUrl: resetUrl,
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
          .btn { display: inline-block; background-color: #00e6a8; color: #070c1a; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
          .footer { font-size: 11px; color: #64748b; margin-top: 32px; border-top: 1px solid #1e293b; pt-4; }
          .raw-link { word-break: break-all; color: #38bdf8; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">🛡️ TRUEVISION DEEPSHIELD</div>
          <div class="title">Reset your DeepShield password</div>
          <p class="text">
            Hello <strong>${fullName}</strong>,<br><br>
            A request was received to reset the master password for your DeepShield Enterprise console account.<br><br>
            Please use the secure link below to establish a new password:
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
          </div>
          <p class="text">
            Or copy and paste this reset URL into your browser:<br>
            <a href="${resetUrl}" class="raw-link">${resetUrl}</a>
          </p>
          <p class="text" style="font-size: 12px;">
            This link will expire in 1 hour and can only be used once.<br>
            If you did not request a password reset, please notify your security administrator immediately.
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
Hello ${fullName},

A request was received to reset the master password for your DeepShield Enterprise console account.

Please use the secure link below to reset your password:

${resetUrl}

This link will expire in 1 hour and can only be used once.
If you did not request a password reset, please contact your security administrator.

Regards,
DeepShield Enterprise Security Team
    `.trim();

    try {
      const info = await transporter.sendMail({
        from: ENV.SMTP_FROM,
        to,
        subject: 'Reset your DeepShield password',
        text: textBody,
        html: htmlBody,
      });

      console.log(`[Email Service] Password reset email dispatched successfully. ID: ${info.messageId}`);

      return {
        delivered: true,
        messageId: info.messageId,
        actionUrl: resetUrl,
      };
    } catch (err: any) {
      console.error(`[Email Service ERROR] Failed to send password reset email:`, err.message);
      return {
        delivered: false,
        reason: err.message,
        actionUrl: resetUrl,
      };
    }
  }
}
