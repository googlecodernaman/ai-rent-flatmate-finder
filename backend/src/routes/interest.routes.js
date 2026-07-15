'use strict';

const { Router } = require('express');
const { z } = require('zod');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { validate } = require('../middleware/validate');
const ctrl = require('../controllers/interest.controller');

const router = Router();

const expressInterestSchema = z.object({
  listingId: z.string().uuid('listingId must be a valid UUID'),
});

// TENANT routes
router.post(
  '/',
  authenticate,
  requireRole('TENANT'),
  validate(expressInterestSchema),
  ctrl.expressInterest
);

router.get(
  '/',
  authenticate,
  requireRole('TENANT'),
  ctrl.getTenantInterests
);

// OWNER routes
router.get(
  '/received',
  authenticate,
  requireRole('OWNER'),
  ctrl.getOwnerInterests
);

router.patch(
  '/:id/accept',
  authenticate,
  requireRole('OWNER'),
  ctrl.acceptInterest
);

router.patch(
  '/:id/decline',
  authenticate,
  requireRole('OWNER'),
  ctrl.declineInterest
);

module.exports = router;
