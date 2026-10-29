import { AppError } from '../utils/errors.js';

/**
 * Centralized error handling middleware.
 * Ensures all API errors return a clean, consistent JSON response.
 * Never leaks sensitive stack traces or database connection details to clients.
 */
export function errorHandler(err, req, res, next) {
  // Log server errors for backend debugging (avoiding credentials)
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error] ${err.name || 'Error'}: ${err.message}`);
  }

  // Handle known AppError instances (BadRequestError, NotFoundError, ConflictError)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { errors: err.details } : {}),
    });
  }

  // Handle PostgreSQL specific constraint errors
  if (err.code) {
    // Unique violation (e.g. duplicate email)
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'A record with these details already exists.',
      });
    }

    // Foreign key violation (e.g. employee does not exist or cannot delete)
    if (err.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Referenced employee record does not exist or is protected.',
      });
    }

    // Check constraint violation (e.g. end_date < start_date)
    if (err.code === '23514') {
      return res.status(400).json({
        success: false,
        message: 'Database check constraint failed. Please verify dates and status values.',
      });
    }

    // Invalid input syntax (e.g. string for integer or date)
    if (err.code === '22P02') {
      return res.status(400).json({
        success: false,
        message: 'Invalid input format for database field.',
      });
    }
  }

  // Default to 500 Internal Server Error
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'An unexpected server error occurred.' : err.message;

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}

export default errorHandler;
