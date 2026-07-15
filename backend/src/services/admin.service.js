'use strict';

const prisma = require('../lib/prisma');
const { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } = require('../config/constants');

async function getStats() {
  const [users, listings, interests, scores] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count(),
    prisma.interestRequest.count(),
    prisma.compatibilityScore.count(),
  ]);
  return { users, listings, interests, scores };
}

async function listUsers(query) {
  const page = Math.max(1, parseInt(query.page) || DEFAULT_PAGE);
  const limit = Math.min(parseInt(query.limit) || DEFAULT_LIMIT, MAX_LIMIT);
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.user.count(),
  ]);

  return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function deleteUser(userId) {
  // User deletion cascades to all related records (schema: onDelete: Cascade)
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const { AppError } = require('../middleware/errorHandler');
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  await prisma.user.delete({ where: { id: userId } });
}

async function listListings(query) {
  const page = Math.max(1, parseInt(query.page) || DEFAULT_PAGE);
  const limit = Math.min(parseInt(query.limit) || DEFAULT_LIMIT, MAX_LIMIT);
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.listing.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { owner: { select: { id: true, name: true, email: true } } },
    }),
    prisma.listing.count(),
  ]);

  return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

module.exports = { getStats, listUsers, deleteUser, listListings };
