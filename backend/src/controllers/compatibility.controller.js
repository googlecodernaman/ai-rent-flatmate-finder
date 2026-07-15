const { computeAndPersistScore, getPersistedScore } = require('../services/scoring.service');
const { AppError } = require('../middleware/errorHandler');
const prisma = require('../lib/prisma');

/**
 * GET /api/compatibility/:listingId
 * Returns the compatibility score for the authenticated tenant + given listing.
 * Lazy-computes if score doesn't exist yet.
 */
async function getScore(req, res, next) {
  try {
    const tenantId = req.user.id;
    const { listingId } = req.params;

    // Verify listing exists
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new AppError('Listing not found', 404, 'LISTING_NOT_FOUND');

    // Verify tenant profile exists
    const profile = await prisma.tenantProfile.findUnique({ where: { userId: tenantId } });
    if (!profile) throw new AppError(
      'You must create a profile before viewing compatibility scores.',
      404,
      'PROFILE_NOT_FOUND'
    );

    // Check for existing score (lazy compute if missing)
    let score = await getPersistedScore(tenantId, listingId);
    if (!score) {
      score = await computeAndPersistScore(tenantId, listingId);
    }

    res.status(200).json({
      listingId,
      score: score.score,
      explanation: score.explanation,
      isFallback: score.isFallback,
      computedAt: score.createdAt,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getScore };
