const prisma = require('../lib/prisma');
const { AppError } = require('../middleware/errorHandler');
const { scoreAllListingsForTenant } = require('./batchScoring.service');

/**
 * Create a tenant profile for the authenticated user.
 * Each tenant may have exactly one profile.
 *
 * @param {string} tenantId - User ID (from JWT)
 * @param {object} data - { preferredLocation, budgetMin, budgetMax, moveInDate }
 * @returns {object} profile
 */
async function createProfile(tenantId, data) {
  // Guard: only one profile per tenant
  const existing = await prisma.tenantProfile.findUnique({
    where: { userId: tenantId },
  });
  if (existing) {
    throw new AppError(
      'You already have a profile. Use PUT to update it.',
      409,
      'PROFILE_ALREADY_EXISTS'
    );
  }

  // Guard: budget range must be valid
  if (data.budgetMin > data.budgetMax) {
    throw new AppError(
      'budgetMin must not exceed budgetMax',
      400,
      'INVALID_BUDGET_RANGE'
    );
  }

  const profile = await prisma.tenantProfile.create({
    data: {
      userId: tenantId,
      preferredLocation: data.preferredLocation,
      budgetMin: data.budgetMin,
      budgetMax: data.budgetMax,
      moveInDate: new Date(data.moveInDate),
    },
    select: {
      id: true,
      userId: true,
      preferredLocation: true,
      budgetMin: true,
      budgetMax: true,
      moveInDate: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Fire-and-forget: compute scores for all active listings
  scoreAllListingsForTenant(profile.userId).catch(console.error);

  return profile;
}

/**
 * Get the tenant's own profile.
 *
 * @param {string} tenantId
 * @returns {object} profile
 */
async function getProfile(tenantId) {
  const profile = await prisma.tenantProfile.findUnique({
    where: { userId: tenantId },
    select: {
      id: true,
      userId: true,
      preferredLocation: true,
      budgetMin: true,
      budgetMax: true,
      moveInDate: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!profile) {
    throw new AppError(
      'Profile not found. Create one first via POST /api/tenant-profile.',
      404,
      'PROFILE_NOT_FOUND'
    );
  }

  return profile;
}

/**
 * Update the tenant's profile.
 * All fields are optional — only provided fields are updated.
 *
 * @param {string} tenantId
 * @param {object} data - Partial { preferredLocation, budgetMin, budgetMax, moveInDate }
 * @returns {object} updated profile
 */
async function updateProfile(tenantId, data) {
  // Confirm profile exists
  const existing = await prisma.tenantProfile.findUnique({
    where: { userId: tenantId },
  });
  if (!existing) {
    throw new AppError(
      'Profile not found. Create one first via POST /api/tenant-profile.',
      404,
      'PROFILE_NOT_FOUND'
    );
  }

  // Resolve final budget values (merge incoming with existing)
  const finalMin = data.budgetMin !== undefined ? data.budgetMin : existing.budgetMin;
  const finalMax = data.budgetMax !== undefined ? data.budgetMax : existing.budgetMax;

  if (finalMin > finalMax) {
    throw new AppError(
      'budgetMin must not exceed budgetMax',
      400,
      'INVALID_BUDGET_RANGE'
    );
  }

  const updateData = {};
  if (data.preferredLocation !== undefined) updateData.preferredLocation = data.preferredLocation;
  if (data.budgetMin !== undefined) updateData.budgetMin = data.budgetMin;
  if (data.budgetMax !== undefined) updateData.budgetMax = data.budgetMax;
  if (data.moveInDate !== undefined) updateData.moveInDate = new Date(data.moveInDate);

  const profile = await prisma.tenantProfile.update({
    where: { userId: tenantId },
    data: updateData,
    select: {
      id: true,
      userId: true,
      preferredLocation: true,
      budgetMin: true,
      budgetMax: true,
      moveInDate: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Fire-and-forget: recompute scores for all active listings
  scoreAllListingsForTenant(tenantId).catch(console.error);

  return profile;
}

module.exports = { createProfile, getProfile, updateProfile };
