const prisma = require('../lib/prisma');
const gemini = require('./gemini.service');
const { SCORE_BUDGET_WEIGHT, SCORE_LOCATION_WEIGHT } = require('../config/constants');

/**
 * Compute and persist a compatibility score for one (tenant, listing) pair.
 *
 * Strategy:
 *   1. Try Gemini Flash (LLM).
 *   2. If LLM unavailable or fails → rule-based fallback.
 *   3. Upsert result into CompatibilityScore table.
 *
 * @param {string} tenantId
 * @param {string} listingId
 * @returns {object} CompatibilityScore record
 */
async function computeAndPersistScore(tenantId, listingId) {
  // Load tenant profile and listing in parallel
  const [profile, listing] = await Promise.all([
    prisma.tenantProfile.findUnique({ where: { userId: tenantId } }),
    prisma.listing.findUnique({ where: { id: listingId } }),
  ]);

  if (!profile || !listing) {
    throw new Error(`Cannot score: missing profile (${!profile}) or listing (${!listing})`);
  }

  // Try LLM first
  let scoreData = await gemini.getCompatibilityScore(profile, listing);
  let isFallback = false;

  // Fall back to rule-based scorer
  if (!scoreData) {
    scoreData = computeFallbackScore(profile, listing);
    isFallback = true;
  }

  // Upsert — one score per (tenant, listing) pair
  const record = await prisma.compatibilityScore.upsert({
    where: { tenantId_listingId: { tenantId, listingId } },
    create: {
      tenantId,
      listingId,
      score: scoreData.score,
      explanation: scoreData.explanation,
      isFallback,
    },
    update: {
      score: scoreData.score,
      explanation: scoreData.explanation,
      isFallback,
    },
  });

  return record;
}

/**
 * Rule-based fallback scorer.
 * Formula: (budgetScore * 0.6) + (locationScore * 0.4)
 *
 * Budget score: 100 if listing rent is within tenant's budget range, else 0.
 * Location score: 100 if location is a case-insensitive substring match, else 0.
 *
 * @param {object} profile
 * @param {object} listing
 * @returns {{ score: number, explanation: string }}
 */
function computeFallbackScore(profile, listing) {
  // Budget: rent must fall within [budgetMin, budgetMax]
  const budgetMatch = listing.rent >= profile.budgetMin && listing.rent <= profile.budgetMax;
  const budgetScore = budgetMatch ? 100 : 0;

  // Location: case-insensitive substring match either direction
  const loc1 = listing.location.toLowerCase();
  const loc2 = profile.preferredLocation.toLowerCase();
  const locationMatch = loc1.includes(loc2) || loc2.includes(loc1);
  const locationScore = locationMatch ? 100 : 0;

  const finalScore = Math.round(
    budgetScore * SCORE_BUDGET_WEIGHT + locationScore * SCORE_LOCATION_WEIGHT
  );

  const parts = [];
  if (budgetMatch) parts.push('rent is within budget');
  else parts.push('rent is outside budget range');
  if (locationMatch) parts.push('location matches preference');
  else parts.push('location does not match preference');

  return {
    score: finalScore,
    explanation: `Rule-based score: ${parts.join('; ')}.`,
  };
}

/**
 * Retrieve a persisted score for a (tenant, listing) pair.
 * Returns null if no score exists yet.
 */
async function getPersistedScore(tenantId, listingId) {
  return prisma.compatibilityScore.findUnique({
    where: { tenantId_listingId: { tenantId, listingId } },
  });
}

module.exports = { computeAndPersistScore, computeFallbackScore, getPersistedScore };
