const prisma = require('../lib/prisma');
const { computeAndPersistScore } = require('./scoring.service');
const { BATCH_SCORE_DELAY_MS } = require('../config/constants');

/**
 * Pauses execution for the configured batch delay.
 * Prevents hitting Gemini's rate limit (~15 RPM on free tier).
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Compute scores for ALL active (non-filled) listings for a single tenant.
 * Called when a tenant profile is created or updated.
 *
 * Fire-and-forget: callers should NOT await this. Use:
 *   scoreAllListingsForTenant(id).catch(console.error);
 */
async function scoreAllListingsForTenant(tenantId) {
  const listings = await prisma.listing.findMany({
    where: { isFilled: false },
    select: { id: true },
  });

  console.log(`[batch] Scoring ${listings.length} listings for tenant ${tenantId}`);

  for (const listing of listings) {
    try {
      await computeAndPersistScore(tenantId, listing.id);
    } catch (err) {
      console.error(`[batch] Failed scoring tenant=${tenantId} listing=${listing.id}:`, err.message);
    }
    // Throttle to respect Gemini RPM limits
    if (listings.length > 1) await delay(BATCH_SCORE_DELAY_MS);
  }

  console.log(`[batch] Done scoring for tenant ${tenantId}`);
}

/**
 * Compute scores for ALL tenants with profiles for a single listing.
 * Called when a new listing is created.
 *
 * Fire-and-forget.
 */
async function scoreAllTenantsForListing(listingId) {
  const profiles = await prisma.tenantProfile.findMany({
    select: { userId: true },
  });

  console.log(`[batch] Scoring ${profiles.length} tenants for listing ${listingId}`);

  for (const profile of profiles) {
    try {
      await computeAndPersistScore(profile.userId, listingId);
    } catch (err) {
      console.error(`[batch] Failed scoring tenant=${profile.userId} listing=${listingId}:`, err.message);
    }
    if (profiles.length > 1) await delay(BATCH_SCORE_DELAY_MS);
  }

  console.log(`[batch] Done scoring for listing ${listingId}`);
}

/**
 * Delete existing scores for a listing then recompute for all tenants.
 * Called when a listing's material fields (rent, location, roomType, furnishingStatus) change.
 *
 * Fire-and-forget.
 */
async function invalidateAndRescore(listingId) {
  // Delete stale scores first
  const deleted = await prisma.compatibilityScore.deleteMany({
    where: { listingId },
  });
  console.log(`[batch] Invalidated ${deleted.count} scores for listing ${listingId}`);

  // Recompute for all tenants
  await scoreAllTenantsForListing(listingId);
}

module.exports = {
  scoreAllListingsForTenant,
  scoreAllTenantsForListing,
  invalidateAndRescore,
};
