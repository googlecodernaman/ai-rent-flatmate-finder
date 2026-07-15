const { AppError } = require('./errorHandler');

/**
 * Role-based access control middleware factory.
 * Usage: requireRole('OWNER') or requireRole('OWNER', 'ADMIN')
 *
 * Must be used AFTER the `authenticate` middleware (requires req.user).
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'NOT_AUTHENTICATED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Required role: ${allowedRoles.join(' or ')}`,
          403,
          'INSUFFICIENT_ROLE'
        )
      );
    }

    next();
  };
}

module.exports = { requireRole };
