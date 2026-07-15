/**
 * Global error handler middleware.
 * Catches all errors thrown in route handlers and returns a consistent JSON response.
 *
 * Error response format:
 * {
 *   error: {
 *     message: string,
 *     code: string,        // machine-readable error code
 *     details?: any        // optional field-level validation errors
 *   }
 * }
 */

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Log the full error in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('❌ Error:', err);
  } else {
    // In production, log only message + stack (not full object)
    console.error(`❌ ${err.message}`);
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    });
  }

  // Prisma known request errors (unique constraint, not found, etc.)
  if (err.code === 'P2002') {
    const target = err.meta?.target;
    return res.status(409).json({
      error: {
        message: `A record with this ${target || 'value'} already exists`,
        code: 'DUPLICATE_ENTRY',
      },
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: {
        message: 'Record not found',
        code: 'NOT_FOUND',
      },
    });
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: {
        message: 'File too large',
        code: 'FILE_TOO_LARGE',
      },
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: {
        message: 'Unexpected file field',
        code: 'UNEXPECTED_FILE',
      },
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: {
        message: 'Invalid token',
        code: 'INVALID_TOKEN',
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: {
        message: 'Token expired',
        code: 'TOKEN_EXPIRED',
      },
    });
  }

  // Application errors with explicit status codes
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code || 'APPLICATION_ERROR',
      },
    });
  }

  // Fallback: unexpected errors → 500
  return res.status(500).json({
    error: {
      message:
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : err.message,
      code: 'INTERNAL_ERROR',
    },
  });
}

/**
 * Custom application error with status code.
 * Usage: throw new AppError('Not found', 404, 'NOT_FOUND')
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'APPLICATION_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'AppError';
  }
}

module.exports = { errorHandler, AppError };
