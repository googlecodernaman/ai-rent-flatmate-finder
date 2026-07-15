const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { env } = require('../config/env');
const { BCRYPT_ROUNDS } = require('../config/constants');
const { AppError } = require('../middleware/errorHandler');

/**
 * Register a new user.
 * Admin role cannot be self-registered — only the seed script creates admins.
 *
 * @param {object} data - { name, email, password, role }
 * @returns {object} { user, token }
 */
async function register({ name, email, password, role }) {
  // Block admin self-registration
  if (role === 'ADMIN') {
    throw new AppError('Admin accounts cannot be self-registered', 400, 'ADMIN_REGISTRATION_BLOCKED');
  }

  // Check duplicate email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError('An account with this email already exists', 409, 'DUPLICATE_EMAIL');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  const token = signToken(user.id, user.role);
  return { user, token };
}

/**
 * Authenticate a user with email + password.
 *
 * @param {string} email
 * @param {string} password
 * @returns {object} { user, token }
 */
async function login({ email, password }) {
  // Find user — select passwordHash for comparison
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      passwordHash: true,
      createdAt: true,
    },
  });

  if (!user) {
    // Consistent error message to avoid email enumeration
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  // Never return the password hash
  const { passwordHash, ...safeUser } = user;
  const token = signToken(safeUser.id, safeUser.role);
  return { user: safeUser, token };
}

/**
 * Get the current user's profile by ID.
 *
 * @param {string} userId
 * @returns {object} user
 */
async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  return user;
}

/**
 * Sign a JWT token with the user's ID and role.
 * @private
 */
function signToken(userId, role) {
  return jwt.sign({ id: userId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

module.exports = { register, login, getMe };
