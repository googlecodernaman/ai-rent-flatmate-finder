const tenantProfileService = require('../services/tenantProfile.service');

/**
 * POST /api/tenant-profile
 */
async function createProfile(req, res, next) {
  try {
    const profile = await tenantProfileService.createProfile(req.user.id, req.body);
    res.status(201).json(profile);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tenant-profile
 */
async function getProfile(req, res, next) {
  try {
    const profile = await tenantProfileService.getProfile(req.user.id);
    res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/tenant-profile
 */
async function updateProfile(req, res, next) {
  try {
    const profile = await tenantProfileService.updateProfile(req.user.id, req.body);
    res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
}

module.exports = { createProfile, getProfile, updateProfile };
