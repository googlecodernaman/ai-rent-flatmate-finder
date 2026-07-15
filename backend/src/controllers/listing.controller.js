const listingService = require('../services/listing.service');
const { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } = require('../config/constants');

// ── Owner controllers ─────────────────────────────────────────────────────────

async function createListing(req, res, next) {
  try {
    const listing = await listingService.createListing(req.user.id, req.body, req.files || []);
    res.status(201).json(listing);
  } catch (err) { next(err); }
}

async function getOwnerListings(req, res, next) {
  try {
    const listings = await listingService.getOwnerListings(req.user.id);
    res.status(200).json(listings);
  } catch (err) { next(err); }
}

async function updateListing(req, res, next) {
  try {
    const { listing } = await listingService.updateListing(
      req.params.id, req.user.id, req.body, req.files || []
    );
    res.status(200).json(listing);
  } catch (err) { next(err); }
}

async function deleteListing(req, res, next) {
  try {
    await listingService.deleteListing(req.params.id, req.user.id);
    res.status(204).send();
  } catch (err) { next(err); }
}

async function markFilled(req, res, next) {
  try {
    const listing = await listingService.markFilled(req.params.id, req.user.id);
    res.status(200).json(listing);
  } catch (err) { next(err); }
}

// ── Tenant controllers ────────────────────────────────────────────────────────

async function browseListings(req, res, next) {
  try {
    const page  = Math.max(1, parseInt(req.query.page, 10) || DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_LIMIT));
    const budgetMin = req.query.budgetMin !== undefined ? parseInt(req.query.budgetMin, 10) : undefined;
    const budgetMax = req.query.budgetMax !== undefined ? parseInt(req.query.budgetMax, 10) : undefined;

    const result = await listingService.browseListings({
      location: req.query.location,
      budgetMin,
      budgetMax,
      page,
      limit,
    });
    res.status(200).json(result);
  } catch (err) { next(err); }
}

async function getListingById(req, res, next) {
  try {
    const listing = await listingService.getListingById(req.params.id);
    res.status(200).json(listing);
  } catch (err) { next(err); }
}

module.exports = {
  createListing,
  getOwnerListings,
  updateListing,
  deleteListing,
  markFilled,
  browseListings,
  getListingById,
};
