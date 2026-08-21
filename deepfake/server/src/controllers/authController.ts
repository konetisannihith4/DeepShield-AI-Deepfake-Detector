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

// Schema Validation via Zod DTOs
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

const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email address format').transform((val) => val.toLowerCase().trim()),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address format').transform((val) => val.toLowerCase().trim()),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

export class AuthController {
  /**
   * Register a new user account with unverified status and dispatch verification email
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

      // Generate cryptographically secure verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create user with isEmailVerified: false
      const user = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash,
          fullName: data.fullName,
          role: Role.ANALYST,
          organizationId: org.id,
          isEmailVerified: false,
          emailVerificationToken: verificationToken,
          emailVerificationExpiresAt: verificationExpiresAt,
        },
      });

      // Dispatch real verification email
      const emailResult = await EmailService.sendVerificationEmail(
        user.email,
        user.fullName,
        verificationToken
      );

      return res.status(201).json({
        success: true,
        requiresVerification: true,
        email: user.email,
        emailDelivered: emailResult.delivered,
        message: 'Account created successfully. Please check your email to verify your account before logging in.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Verify user account via cryptographic token
   */
  public static async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const token = typeof req.query.token === 'string' ? req.query.token : req.body.token;

      if (!token) {
        throw new AppError('Verification token is required', 400);
      }

      const user = await prisma.user.findFirst({
        where: {
          emailVerificationToken: token,
          emailVerificationExpiresAt: { gt: new Date() },
        },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Verification token is invalid or has expired. Please request a new verification link.',
        });
      }

      // Mark user email verified and consume verification token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpiresAt: null,
        },
      });

      return res.json({
        success: true,
        message: 'Your email address has been verified successfully. You may now sign in to your security console.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Resend account verification email
   */
  public static async resendVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const data = resendVerificationSchema.parse(req.body);

      const user = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (user && !user.isEmailVerified && user.isActive) {
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await prisma.user.update({
          where: { id: user.id },
          data: {
            emailVerificationToken: verificationToken,
            emailVerificationExpiresAt: verificationExpiresAt,
          },
        });

        await EmailService.sendVerificationEmail(user.email, user.fullName, verificationToken);
      }

      // Generic message prevents email enumeration
      return res.json({
        success: true,
        message: 'If an unverified account exists for this email address, a new verification link has been sent.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Authenticate user credentials and enforce verified email check
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

      // Enforce email verification
      if (!user.isEmailVerified) {
        return res.status(403).json({
          success: false,
          isUnverified: true,
          email: user.email,
          message: 'Please verify your email address before signing in.',
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

      // Save refresh token to database
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
   * Refresh expired access token using valid refresh token
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
   * Invalidate refresh token and logout
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
   * Get current authenticated user profile
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

  /**
   * Request password reset token and send real reset email
   */
  public static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const data = forgotPasswordSchema.parse(req.body);

      const user = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (user && user.isActive) {
        // Invalidate any previous unused tokens for this user
        await prisma.passwordResetToken.updateMany({
          where: { userId: user.id, used: false },
          data: { used: true },
        });

        // Generate crypto-secure random reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await prisma.passwordResetToken.create({
          data: {
            token: resetToken,
            userId: user.id,
            expiresAt,
          },
        });

        // Send real password reset email
        await EmailService.sendPasswordResetEmail(user.email, user.fullName, resetToken);
      }

      // Always return a generic response to prevent account enumeration
      return res.json({
        success: true,
        message: 'If an account exists for this email, password reset instructions have been sent.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Verify whether a password reset token is valid before displaying form
   */
  public static async verifyResetToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = typeof req.query.token === 'string' ? req.query.token : req.body.token;
      if (!token) {
        throw new AppError('Reset token is required', 400);
      }

      const resetRecord = await prisma.passwordResetToken.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!resetRecord || resetRecord.used || resetRecord.expiresAt < new Date()) {
        return res.status(400).json({
          success: false,
          valid: false,
          message: 'Password reset link is invalid or has expired.',
        });
      }

      return res.json({
        success: true,
        valid: true,
        email: resetRecord.user.email,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Consume password reset token and update user password
   */
  public static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const data = resetPasswordSchema.parse(req.body);

      const resetRecord = await prisma.passwordResetToken.findUnique({
        where: { token: data.token },
        include: { user: true },
      });

      if (!resetRecord || resetRecord.used || resetRecord.expiresAt < new Date()) {
        throw new AppError('Password reset token is invalid or has expired.', 400);
      }

      // Hash new password securely
      const passwordHash = await bcrypt.hash(data.password, 10);

      // Update user password and consume token in transaction
      await prisma.$transaction([
        prisma.user.update({
          where: { id: resetRecord.userId },
          data: { passwordHash },
        }),
        prisma.passwordResetToken.update({
          where: { id: resetRecord.id },
          data: { used: true },
        }),
        // Invalidate all existing refresh tokens for security
        prisma.refreshToken.updateMany({
          where: { userId: resetRecord.userId },
          data: { revoked: true },
        }),
      ]);

      return res.json({
        success: true,
        message: 'Password has been reset successfully. Please log in with your new credentials.',
      });
    } catch (err) {
      next(err);
    }
  }
}
