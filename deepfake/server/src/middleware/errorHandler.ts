import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('[Centralized Error Handler]:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      details: err.details || null,
      timestamp: new Date().toISOString(),
    });
  }

  if (err instanceof ZodError) {
    const formattedDetails = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    const errorMessageSummary = formattedDetails
      .map((d) => (d.field ? `${d.field}: ${d.message}` : d.message))
      .join('; ');

    return res.status(400).json({
      success: false,
      error: errorMessageSummary ? `Validation Error: ${errorMessageSummary}` : 'Validation Error',
      details: formattedDetails,
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
  });
};
