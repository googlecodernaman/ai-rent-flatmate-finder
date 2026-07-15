const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { AppError } = require('./errorHandler');

/**
 * JWT verification middleware.
 * Attaches the decoded user object to req.user.
 * Throws 401 if token is missing, invalid, or expired.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication token required', 401, 'MISSING_TOKEN');
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Attach minimal user info from token — no DB lookup needed on every request
    // (role is embedded in the JWT, so we don't need to re-query the DB)
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (err) {
    // Let JWT errors (JsonWebTokenError, TokenExpiredError) bubble to errorHandler
    next(err);
  }
}

module.exports = { authenticate };
