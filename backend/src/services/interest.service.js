'use strict';

const prisma = require('../lib/prisma');
const { AppError } = require('../middleware/errorHandler');

/**
 * Tenant expresses interest in a listing.
 * Looks up ownerId from listing; creates InterestRequest with PENDING status.
 */
async function expressInterest(tenantId, listingId) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, ownerId: true, isFilled: true },
  });
  if (!listing) throw new AppError('Listing not found', 404, 'LISTING_NOT_FOUND');
  if (listing.isFilled) throw new AppError('Listing is no longer available', 410, 'LISTING_FILLED');
  if (listing.ownerId === tenantId) throw new AppError('You cannot express interest in your own listing', 400, 'SELF_INTEREST');

  const existing = await prisma.interestRequest.findUnique({
    where: { tenantId_listingId: { tenantId, listingId } },
  });
  if (existing) throw new AppError('Interest already expressed for this listing', 409, 'INTEREST_EXISTS');

  return prisma.interestRequest.create({
    data: { tenantId, listingId, ownerId: listing.ownerId },
    include: {
      listing: { select: { id: true, title: true, location: true, rent: true } },
    },
  });
}

/**
 * Tenant: list own sent interests.
 */
async function getTenantInterests(tenantId) {
  return prisma.interestRequest.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      listing: { select: { id: true, title: true, location: true, rent: true, ownerId: true } },
    },
  });
}

/**
 * Owner: list interests received on own listings, with tenant info + compatibility score.
 */
async function getOwnerInterests(ownerId) {
  const interests = await prisma.interestRequest.findMany({
    where: { ownerId },
    orderBy: { createdAt: 'desc' },
    include: {
      listing: { select: { id: true, title: true, location: true, rent: true } },
      tenant: { select: { id: true, name: true, email: true } },
    },
  });

  // Attach compatibility score for each interest
  const withScores = await Promise.all(
    interests.map(async (interest) => {
      const scoreRow = await prisma.compatibilityScore.findUnique({
        where: {
          tenantId_listingId: { tenantId: interest.tenantId, listingId: interest.listingId },
        },
        select: { score: true, isFallback: true },
      });
      return {
        ...interest,
        compatibilityScore: scoreRow ? scoreRow.score : null,
        scoreFallback: scoreRow ? scoreRow.isFallback : null,
      };
    })
  );

  return withScores;
}

/**
 * Owner: accept an interest request.
 * Returns updated interest. Caller is responsible for triggering email.
 */
async function acceptInterest(interestId, ownerId) {
  const interest = await _getOwnedInterest(interestId, ownerId);
  if (interest.status !== 'PENDING') {
    throw new AppError(`Interest is already ${interest.status}`, 400, 'INVALID_STATUS_TRANSITION');
  }
  return prisma.interestRequest.update({
    where: { id: interestId },
    data: { status: 'ACCEPTED' },
    include: {
      listing: { select: { id: true, title: true, location: true, rent: true } },
      tenant: { select: { id: true, name: true, email: true } },
    },
  });
}

/**
 * Owner: decline an interest request.
 */
async function declineInterest(interestId, ownerId) {
  const interest = await _getOwnedInterest(interestId, ownerId);
  if (interest.status !== 'PENDING') {
    throw new AppError(`Interest is already ${interest.status}`, 400, 'INVALID_STATUS_TRANSITION');
  }
  return prisma.interestRequest.update({
    where: { id: interestId },
    data: { status: 'DECLINED' },
    include: {
      listing: { select: { id: true, title: true, location: true, rent: true } },
    },
  });
}

/** Shared helper — verify interest exists and belongs to ownerId. */
async function _getOwnedInterest(interestId, ownerId) {
  const interest = await prisma.interestRequest.findUnique({
    where: { id: interestId },
  });
  if (!interest) throw new AppError('Interest request not found', 404, 'INTEREST_NOT_FOUND');
  if (interest.ownerId !== ownerId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
  return interest;
}

module.exports = { expressInterest, getTenantInterests, getOwnerInterests, acceptInterest, declineInterest };
