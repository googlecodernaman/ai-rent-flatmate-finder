const prisma = require('../lib/prisma');
const { AppError } = require('../middleware/errorHandler');
const { scoreAllTenantsForListing, invalidateAndRescore } = require('./batchScoring.service');

// Fields whose edits invalidate compatibility scores (used in Task 8)
const MATERIAL_FIELDS = new Set(['intent', 'rent', 'location', 'roomType', 'furnishingStatus']);

/**
 * Create a listing. Photos are stored as relative URL paths.
 */
async function createListing(ownerId, data, files = []) {
  const photos = files.map((f) => `/uploads/${f.filename}`);

  const listing = await prisma.listing.create({
    data: {
      ownerId,
      intent: data.intent,
      title: data.title,
      description: data.description || null,
      location: data.location,
      rent: parseInt(data.rent, 10),
      availableFrom: new Date(data.availableFrom),
      roomType: data.roomType,
      furnishingStatus: data.furnishingStatus,
      photos,
    },
    select: listingSelectFields(),
  });

  // Fire-and-forget: compute scores for all tenants with profiles
  scoreAllTenantsForListing(listing.id).catch(console.error);

  return listing;
}

/**
 * Get all listings belonging to the authenticated owner.
 */
async function getOwnerListings(ownerId) {
  return prisma.listing.findMany({
    where: { ownerId },
    select: listingSelectFields(),
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get a single listing by ID — verifies ownership.
 */
async function getOwnerListingById(listingId, ownerId) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: listingSelectFields(),
  });

  if (!listing) throw new AppError('Listing not found', 404, 'LISTING_NOT_FOUND');
  if (listing.ownerId !== ownerId) throw new AppError('Forbidden', 403, 'FORBIDDEN');

  return listing;
}

/**
 * Update a listing. Returns { listing, materialFieldChanged }.
 * materialFieldChanged signals Task 8 to invalidate scores.
 */
async function updateListing(listingId, ownerId, data, files = []) {
  const existing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!existing) throw new AppError('Listing not found', 404, 'LISTING_NOT_FOUND');
  if (existing.ownerId !== ownerId) throw new AppError('Forbidden', 403, 'FORBIDDEN');

  const updateData = {};
  let materialFieldChanged = false;

  const fieldMap = {
    title: 'title',
    intent: 'intent',
    description: 'description',
    location: 'location',
    rent: 'rent',
    availableFrom: 'availableFrom',
    roomType: 'roomType',
    furnishingStatus: 'furnishingStatus',
  };

  for (const [key, dbKey] of Object.entries(fieldMap)) {
    if (data[key] !== undefined) {
      if (dbKey === 'rent') {
        updateData[dbKey] = parseInt(data[key], 10);
      } else if (dbKey === 'availableFrom') {
        updateData[dbKey] = new Date(data[key]);
      } else {
        updateData[dbKey] = data[key];
      }
      if (MATERIAL_FIELDS.has(key)) materialFieldChanged = true;
    }
  }

  // Append new photos if provided
  if (files.length > 0) {
    const newPhotos = files.map((f) => `/uploads/${f.filename}`);
    updateData.photos = [...existing.photos, ...newPhotos];
  }

  const listing = await prisma.listing.update({
    where: { id: listingId },
    data: updateData,
    select: listingSelectFields(),
  });

  // Fire-and-forget: if material fields changed, invalidate+rescore
  if (materialFieldChanged) {
    invalidateAndRescore(listingId).catch(console.error);
  }

  return { listing, materialFieldChanged };
}

/**
 * Delete a listing. Cascades to interests, messages, scores via DB FK.
 */
async function deleteListing(listingId, ownerId) {
  const existing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!existing) throw new AppError('Listing not found', 404, 'LISTING_NOT_FOUND');
  if (existing.ownerId !== ownerId) throw new AppError('Forbidden', 403, 'FORBIDDEN');

  await prisma.listing.delete({ where: { id: listingId } });
}

/**
 * Mark a listing as filled (room taken).
 */
async function markFilled(listingId, ownerId) {
  const existing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!existing) throw new AppError('Listing not found', 404, 'LISTING_NOT_FOUND');
  if (existing.ownerId !== ownerId) throw new AppError('Forbidden', 403, 'FORBIDDEN');

  return prisma.listing.update({
    where: { id: listingId },
    data: { isFilled: true },
    select: listingSelectFields(),
  });
}

// ── Tenant browse (added here, used in Task 6) ──────────────────────────────

/**
 * Browse active (non-filled) listings with optional filters and pagination.
 * If tenantId is provided, joins compatibility scores and sorts by score desc.
 *
 * @param {object} opts - { location, budgetMin, budgetMax, page, limit, tenantId }
 */
async function browseListings({ location, budgetMin, budgetMax, page = 1, limit = 20, tenantId }) {
  const skip = (page - 1) * limit;
  const where = { isFilled: false };

  if (location) {
    where.location = { contains: location, mode: 'insensitive' };
  }
  if (budgetMin !== undefined || budgetMax !== undefined) {
    where.rent = {};
    if (budgetMin !== undefined) where.rent.gte = budgetMin;
    if (budgetMax !== undefined) where.rent.lte = budgetMax;
  }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      select: listingSelectFields(),
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.listing.count({ where }),
  ]);

  // Join compatibility scores for this tenant if available
  if (tenantId && listings.length > 0) {
    const listingIds = listings.map((l) => l.id);
    const scores = await prisma.compatibilityScore.findMany({
      where: { tenantId, listingId: { in: listingIds } },
      select: { listingId: true, score: true, isFallback: true },
    });

    const scoreMap = new Map(scores.map((s) => [s.listingId, s]));

    // Attach score to each listing
    const withScores = listings.map((l) => {
      const scoreRow = scoreMap.get(l.id);
      return {
        ...l,
        compatibilityScore: scoreRow ? scoreRow.score : null,
        scoreFallback: scoreRow ? scoreRow.isFallback : null,
      };
    });

    // Sort: scored listings first (desc by score), unscored after
    withScores.sort((a, b) => {
      if (a.compatibilityScore === null && b.compatibilityScore === null) return 0;
      if (a.compatibilityScore === null) return 1;
      if (b.compatibilityScore === null) return -1;
      return b.compatibilityScore - a.compatibilityScore;
    });

    return {
      data: withScores,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  return {
    data: listings,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

/**
 * Get a single listing by ID for tenant view (no ownership check).
 */
async function getListingById(listingId) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      ...listingSelectFields(),
      owner: { select: { id: true, name: true, email: true } },
    },
  });

  if (!listing) throw new AppError('Listing not found', 404, 'LISTING_NOT_FOUND');
  if (listing.isFilled) throw new AppError('This listing is no longer available', 410, 'LISTING_FILLED');

  return listing;
}

// ── Shared select fields ─────────────────────────────────────────────────────

function listingSelectFields() {
  return {
    id: true,
    ownerId: true,
    intent: true,
    title: true,
    description: true,
    location: true,
    rent: true,
    availableFrom: true,
    roomType: true,
    furnishingStatus: true,
    photos: true,
    isFilled: true,
    createdAt: true,
    updatedAt: true,
  };
}

module.exports = {
  createListing,
  getOwnerListings,
  getOwnerListingById,
  updateListing,
  deleteListing,
  markFilled,
  browseListings,
  getListingById,
  MATERIAL_FIELDS,
};
