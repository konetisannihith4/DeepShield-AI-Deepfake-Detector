import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { ENV } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { Role } from '@prisma/client';
import { EmailService } from '../services/emailService';

// Schema Validation DTOs
const registerSchema = z.object({
  email: z.string().email('Invalid email address format').transform((val) => val.toLowerCase().trim()),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters long'),
  organizationName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address format').transform((val) => val.toLowerCase().trim()),
  password: z.string().min(1, 'Password is required'),
});

const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address format').transform((val) => val.toLowerCase().trim()),
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^[0-9]{6}$/, 'OTP must contain only numbers'),
  purpose: z.enum(['SIGNUP', 'LOGIN', 'FORGOT_PASSWORD']).optional().default('SIGNUP'),
});

const requestOtpSchema = z.object({
  email: z.string().email('Invalid email address format').transform((val) => val.toLowerCase().trim()),
  purpose: z.enum(['SIGNUP', 'LOGIN', 'FORGOT_PASSWORD']).optional().default('LOGIN'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address format').transform((val) => val.toLowerCase().trim()),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address format').transform((val) => val.toLowerCase().trim()),
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^[0-9]{6}$/, 'OTP must contain only numbers'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

// Helper: Generate & Store Hashed OTP
async function generateAndSendOtp(email: string, fullName: string, purpose: 'SIGNUP' | 'LOGIN' | 'FORGOT_PASSWORD') {
  // 1. Clean up expired OTPs globally
  await prisma.otpVerification.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  // 2. Check 60-second resend cooldown for email + purpose
  const latestOtp = await prisma.otpVerification.findFirst({
    where: { email, purpose },
    orderBy: { createdAt: 'desc' },
  });

  if (latestOtp) {
    const elapsedSeconds = (Date.now() - latestOtp.createdAt.getTime()) / 1000;
    if (elapsedSeconds < 60) {
      const waitSeconds = Math.ceil(60 - elapsedSeconds);
      throw new AppError(`Please wait ${waitSeconds} seconds before requesting a new OTP.`, 429);
    }
  }

  // 3. Invalidate previous active OTPs for this email + purpose
  await prisma.otpVerification.deleteMany({
    where: { email, purpose },
  });

  // 4. Generate cryptographically secure 6-digit OTP
  const rawOtp = crypto.randomInt(100000, 1000000).toString();

  // 5. Hash OTP before DB storage
  const otpHash = await bcrypt.hash(rawOtp, 10);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

  // 6. Save hashed OTP to database
  await prisma.otpVerification.create({
    data: {
      email,
      otpHash,
      purpose,
      attempts: 0,
      expiresAt,
    },
  });

  // 7. Dispatch OTP via email (never store or return plaintext rawOtp)
  const emailResult = await EmailService.sendOtpEmail(email, fullName, rawOtp, purpose);

  return {
    delivered: emailResult.delivered,
  };
}

export class AuthController {
  /**
   * 1. SIGNUP: Register account & send 6-digit OTP
   */
  public static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);

      // Check existing user
      const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
      if (existingUser) {
        throw new AppError('User with this email already exists', 400);
      }

      // Find or create organization
      const orgName = (data.organizationName && data.organizationName.trim())
        ? data.organizationName.trim()
        : `${data.fullName.trim()}'s Org`;

      let org = await prisma.organization.findUnique({
        where: { name: orgName },
      });

      if (!org) {
        const slug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
        org = await prisma.organization.create({
          data: {
            name: orgName,
            slug,
            plan: 'ENTERPRISE',
          },
        });
      }

      // Hash password securely with bcrypt
      const passwordHash = await bcrypt.hash(data.password, 10);

      // Create unverified user account
      const user = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash,
          fullName: data.fullName,
          role: Role.ANALYST,
          organizationId: org.id,
          isEmailVerified: false,
        },
      });

      // Generate and dispatch 6-digit OTP
      const otpResult = await generateAndSendOtp(user.email, user.fullName, 'SIGNUP');

      return res.status(201).json({
        success: true,
        requiresOtp: true,
        email: user.email,
        emailDelivered: otpResult.delivered,
        message: 'Account created successfully. Enter the 6-digit OTP sent to your email.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 2. VERIFY OTP: Validate 6-digit OTP for SIGNUP or LOGIN
   */
  public static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const data = verifyOtpSchema.parse(req.body);

      const record = await prisma.otpVerification.findFirst({
        where: {
          email: data.email,
          purpose: data.purpose,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!record) {
        throw new AppError('No active OTP code found for this email. Please request a new code.', 400);
      }

      // Check Expiration
      if (record.expiresAt < new Date()) {
        await prisma.otpVerification.delete({ where: { id: record.id } });
        throw new AppError('OTP verification code has expired. Please request a new code.', 400);
      }

      // Check Attempt Limit
      if (record.attempts >= 5) {
        await prisma.otpVerification.delete({ where: { id: record.id } });
        throw new AppError('Maximum verification attempts exceeded. Please request a new OTP code.', 429);
      }

      // Verify OTP Hash
      const isValid = await bcrypt.compare(data.otp, record.otpHash);
      if (!isValid) {
        const updatedAttempts = record.attempts + 1;
        if (updatedAttempts >= 5) {
          await prisma.otpVerification.delete({ where: { id: record.id } });
          throw new AppError('Maximum verification attempts exceeded. Please request a new OTP code.', 429);
        } else {
          await prisma.otpVerification.update({
            where: { id: record.id },
            data: { attempts: updatedAttempts },
          });
          const remaining = 5 - updatedAttempts;
          throw new AppError(`Invalid OTP code. ${remaining} attempt(s) remaining.`, 400);
        }
      }

      // Invalidate OTP immediately upon successful verification
      await prisma.otpVerification.deleteMany({
        where: { email: data.email, purpose: data.purpose },
      });

      // Find user & update email verification status
      const user = await prisma.user.findUnique({
        where: { email: data.email },
        include: { organization: true },
      });

      if (!user) {
        throw new AppError('Associated user account was not found.', 404);
      }

      if (!user.isActive) {
        throw new AppError('Account is disabled. Please contact security administrator.', 403);
      }

      if (!user.isEmailVerified) {
        await prisma.user.update({
          where: { id: user.id },
          data: { isEmailVerified: true },
        });
      }

      // Issue JWT Access & Refresh Tokens
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          organizationId: user.organizationId,
        },
        ENV.JWT_SECRET,
        { expiresIn: ENV.JWT_EXPIRES_IN as any }
      );

      const refreshToken = jwt.sign(
        { id: user.id, jti: `${Date.now()}-${crypto.randomBytes(8).toString('hex')}` },
        ENV.JWT_REFRESH_SECRET,
        { expiresIn: ENV.JWT_REFRESH_EXPIRES_IN as any }
      );

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return res.json({
        success: true,
        message: 'Authentication successful.',
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          organizationId: user.organizationId,
          organizationName: user.organization.name,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 3. RESEND OTP: Request new 6-digit OTP with cooldown
   */
  public static async resendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const data = requestOtpSchema.parse(req.body);

      const user = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (user && user.isActive) {
        await generateAndSendOtp(user.email, user.fullName, data.purpose);
      }

      // Prevent email enumeration
      return res.json({
        success: true,
        message: 'If an active account exists for this email, a new 6-digit OTP code has been sent.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 4. LOGIN (Email + Password)
   */
  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);

      const user = await prisma.user.findUnique({
        where: { email: data.email },
        include: { organization: true },
      });

      if (!user) {
        throw new AppError('Invalid email or password', 401);
      }

      if (!user.isActive) {
        throw new AppError('Account is disabled. Please contact your security administrator.', 403);
      }

      const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
      if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
      }

      // If email is not yet verified, send an OTP for verification
      if (!user.isEmailVerified) {
        await generateAndSendOtp(user.email, user.fullName, 'SIGNUP');
        return res.status(403).json({
          success: false,
          requiresOtp: true,
          email: user.email,
          message: 'Please verify your email address. A 6-digit OTP code has been sent.',
        });
      }

      // Generate JWT Access & Refresh Tokens
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          organizationId: user.organizationId,
        },
        ENV.JWT_SECRET,
        { expiresIn: ENV.JWT_EXPIRES_IN as any }
      );

      const refreshToken = jwt.sign(
        { id: user.id, jti: `${Date.now()}-${crypto.randomBytes(8).toString('hex')}` },
        ENV.JWT_REFRESH_SECRET,
        { expiresIn: ENV.JWT_REFRESH_EXPIRES_IN as any }
      );

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return res.json({
        success: true,
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          organizationId: user.organizationId,
          organizationName: user.organization.name,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 5. REQUEST LOGIN OTP (Email + OTP login flow step 1)
   */
  public static async requestLoginOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const data = requestOtpSchema.parse({ ...req.body, purpose: 'LOGIN' });

      const user = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (user && user.isActive) {
        await generateAndSendOtp(user.email, user.fullName, 'LOGIN');
      }

      // Generic response prevents email enumeration
      return res.json({
        success: true,
        message: 'If an account exists for this email, a 6-digit OTP code has been sent.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 6. LOGIN WITH OTP (Email + OTP login flow step 2)
   */
  public static async loginWithOtp(req: Request, res: Response, next: NextFunction) {
    try {
      req.body.purpose = 'LOGIN';
      return await AuthController.verifyOtp(req, res, next);
    } catch (err) {
      next(err);
    }
  }

  /**
   * 7. FORGOT PASSWORD (Request 6-digit OTP for password reset)
   */
  public static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const data = forgotPasswordSchema.parse(req.body);

      const user = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (user && user.isActive) {
        await generateAndSendOtp(user.email, user.fullName, 'FORGOT_PASSWORD');
      }

      // Generic response prevents email enumeration
      return res.json({
        success: true,
        message: 'If an account exists for this email, a 6-digit OTP code has been sent.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 8. RESET PASSWORD (Verify OTP & Update Password)
   */
  public static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const data = resetPasswordSchema.parse(req.body);

      const record = await prisma.otpVerification.findFirst({
        where: {
          email: data.email,
          purpose: 'FORGOT_PASSWORD',
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!record) {
        throw new AppError('No active password reset OTP code found for this email.', 400);
      }

      if (record.expiresAt < new Date()) {
        await prisma.otpVerification.delete({ where: { id: record.id } });
        throw new AppError('OTP code has expired. Please request a new password reset OTP.', 400);
      }

      if (record.attempts >= 5) {
        await prisma.otpVerification.delete({ where: { id: record.id } });
        throw new AppError('Maximum verification attempts exceeded. Please request a new password reset OTP.', 429);
      }

      const isValid = await bcrypt.compare(data.otp, record.otpHash);
      if (!isValid) {
        const updatedAttempts = record.attempts + 1;
        if (updatedAttempts >= 5) {
          await prisma.otpVerification.delete({ where: { id: record.id } });
          throw new AppError('Maximum verification attempts exceeded. Please request a new OTP code.', 429);
        } else {
          await prisma.otpVerification.update({
            where: { id: record.id },
            data: { attempts: updatedAttempts },
          });
          const remaining = 5 - updatedAttempts;
          throw new AppError(`Invalid OTP code. ${remaining} attempt(s) remaining.`, 400);
        }
      }

      const user = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (!user) {
        throw new AppError('User account not found.', 404);
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(data.password, 10);

      // Update user password & clean up OTP and refresh tokens
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { passwordHash, isEmailVerified: true },
        }),
        prisma.otpVerification.deleteMany({
          where: { email: data.email },
        }),
        prisma.refreshToken.updateMany({
          where: { userId: user.id },
          data: { revoked: true },
        }),
      ]);

      return res.json({
        success: true,
        message: 'Your password has been reset successfully. Please log in with your new password.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * REFRESH TOKEN
   */
  public static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const data = refreshTokenSchema.parse(req.body);

      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: data.refreshToken },
        include: { user: { include: { organization: true } } },
      });

      if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
        throw new AppError('Invalid or expired refresh token', 401);
      }

      try {
        jwt.verify(data.refreshToken, ENV.JWT_REFRESH_SECRET);
      } catch (jwtErr) {
        throw new AppError('Invalid or expired refresh token signature', 401);
      }

      const user = storedToken.user;
      if (!user.isActive || !user.isEmailVerified) {
        throw new AppError('Account is disabled or unverified. Please contact administrator.', 403);
      }

      const newToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          organizationId: user.organizationId,
        },
        ENV.JWT_SECRET,
        { expiresIn: ENV.JWT_EXPIRES_IN as any }
      );

      return res.json({
        success: true,
        token: newToken,
        refreshToken: data.refreshToken,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * LOGOUT
   */
  public static async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.body?.refreshToken;
      if (refreshToken) {
        await prisma.refreshToken.updateMany({
          where: { token: refreshToken },
          data: { revoked: true },
        });
      }
      return res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET ME
   */
  public static async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { organization: true },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (!user.isActive || !user.isEmailVerified) {
        throw new AppError('Account is unverified or disabled.', 403);
      }

      return res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          organizationId: user.organizationId,
          organizationName: user.organization.name,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}
