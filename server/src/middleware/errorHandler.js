import crypto from 'crypto';
import { ZodError } from 'zod';
import { maskCredentials } from '../config/secrets.js';

export function errorHandler(err, req, res, next) {
  // Generate unique correlation ID for tracing
  const correlationId = req.headers['x-correlation-id'] || `err_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  // Log detailed technical information to server-side logs ONLY
  console.error(`[Correlation ID: ${correlationId}]`, {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    statusCode: err.statusCode || 500,
    message: maskCredentials(err.message),
    stack: maskCredentials(err.stack),
    userId: req.user?._id?.toString() || 'unauthenticated',
    ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
  });

  // Client response guarantees:
  // 1. NEVER include stack traces, database query details, or file paths
  // 2. Always return a generic error message and the correlation ID

  // Zod validation error (400 Bad Request)
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation failed on submitted request.',
      errors: formattedErrors,
      correlationId,
    });
  }

  // Mongoose bad ObjectId / CastError (404 Not Found)
  if (err.name === 'CastError') {
    return res.status(404).json({
      success: false,
      message: 'The requested resource could not be found.',
      correlationId,
    });
  }

  // Mongoose duplicate key error E11000 (409 Conflict)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'record';
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists.`,
      correlationId,
    });
  }

  // Mongoose validation error (400 Bad Request)
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed on record fields.',
      errors: Object.values(err.errors || {}).map((val) => val.message),
      correlationId,
    });
  }

  // Specific trusted client-side operational errors (4xx)
  const statusCode = typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 500
    ? err.statusCode
    : 500;

  if (statusCode < 500) {
    return res.status(statusCode).json({
      success: false,
      message: maskCredentials(err.message) || 'Request error.',
      correlationId,
    });
  }

  // Internal Server Errors (500): Generic safe response only
  return res.status(500).json({
    success: false,
    message: 'An internal server error occurred. Please contact support with the correlation ID.',
    correlationId,
  });
}
